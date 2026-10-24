"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { X } from "lucide-react";
import { CameraCapture } from "@/components/camera-capture";
import { Button } from "@/components/ui/button";
import { NO_TRACK, type TrackState } from "@/lib/capture/bean-tracker";
import { stopCamera, type CameraOpen } from "@/lib/capture/camera";
import {
  coverMapping,
  mapPoint,
  RING_IDLE,
  RING_LOCK,
  SURROUND,
  unmapPoint,
  viewfinderCircle,
  type BeanPose,
  type Circle,
  type Mapping,
} from "@/lib/capture/framing";
import { grabFrame, sourceOf, type FrameSource } from "@/lib/capture/photo";
import { CHECK_MS, checkFrame, DETECT_SIZE, poseAtTap, refine } from "@/lib/capture/scan-check";

export type ScannerLock = { frame: HTMLCanvasElement; bean: BeanPose; from: Mapping; circle: Circle };

type Props = {
  camera: Promise<CameraOpen>;
  onLock: (lock: ScannerLock) => void;
  onSample: (circle: Circle) => void;
  onClose: () => void;
};

type Status = "starting" | "live" | "photo-needed" | "photo" | "locked";
type Layout = { sw: number; sh: number; circle: Circle };

const HELP_AFTER_MS = 8000; // no lock by then: offer "Tap the bean" and "Use the sample"
const REFINE_REACH = 0.1; // on lock, re-detect within this share of the diameter
const RETICLE_PAD = 1.35;
const CHECK_LOG = 300;

declare global {
  interface Window {
    __scanner?: { checkMs: number[]; mapping: () => Mapping | null; layout: () => Layout; pose: () => BeanPose | null };
  }
}

const layoutFor = (sw: number, sh: number): Layout => ({ sw, sh, circle: viewfinderCircle(sw, sh) });

// Corner brackets around a bean, centred on the origin (the group is moved and turned)
function bracketPath(hx: number, hy: number): string {
  const k = Math.min(hx, hy) * 0.55;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    .map(([sx, sy]) => `M${sx * hx - sx * k},${sy * hy} L${sx * hx},${sy * hy} L${sx * hx},${sy * hy - sy * k}`)
    .join(" ");
}

type ReticleEls = { g: SVGGElement | null; path: SVGPathElement | null; ring: SVGCircleElement | null };

// Moves the reticle onto the bean and fills the progress ring; plain DOM writes, no re-render
function drawReticle(els: ReticleEls, circleR: number, pose: BeanPose | null, m: Mapping, progress: number): void {
  const { g, path, ring } = els;
  if (ring) ring.style.strokeDashoffset = String(2 * Math.PI * (circleR + 1.5) * (1 - progress));
  if (!g || !path) return;
  if (!pose) {
    g.style.opacity = "0";
    return;
  }
  const p = mapPoint(m, pose);
  g.style.opacity = "1";
  g.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${pose.angle}rad)`;
  path.setAttribute("d", bracketPath((pose.major / 2) * m.k * RETICLE_PAD + 6, (pose.minor / 2) * m.k * RETICLE_PAD + 6));
}

// The live scan: the camera (or a still photo) seen through a round viewfinder, a detector on the
// circle's crop of the full-resolution frame, a reticle on the best candidate, and the lock.
// The surround is a fixed dark camera surface in both themes, so its text is fixed white.
export function BeanScanner({ camera, onLock, onSample, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const reticleRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);
  const openRef = useRef<CameraOpen | null>(null);
  const mounted = useRef(false);
  const stopTimer = useRef(0);
  const trackRef = useRef<TrackState>(NO_TRACK);
  const poseRef = useRef<BeanPose | null>(null);
  const mappingRef = useRef<Mapping | null>(null);
  const cropRef = useRef<CanvasRenderingContext2D | null>(null);
  const [layout, setLayout] = useState<Layout>(() => layoutFor(window.innerWidth, window.innerHeight));
  const layoutRef = useRef(layout);
  const [status, setStatus] = useState<Status>("starting");
  const [message, setMessage] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [tapMode, setTapMode] = useState(false);
  const lockRef = useRef(onLock);

  useEffect(() => {
    lockRef.current = onLock;
    layoutRef.current = layout;
  });

  // the overlay's real size, now and after rotation or a browser bar sliding away
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setLayout(layoutFor(width, height));
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  // camera: attach the stream; stop every track on unmount or when the page is left
  useEffect(() => {
    mounted.current = true;
    window.clearTimeout(stopTimer.current);
    let active = true;
    camera.then((open) => {
      if (!mounted.current) return stopCamera(open);
      if (!active) return;
      openRef.current = open;
      if (!open.ok) {
        setMessage(open.message);
        setStatus("photo-needed");
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = open.stream;
      video.play().catch(() => undefined);
      setStatus("live");
    });
    const onHide = () => stopCamera(openRef.current);
    window.addEventListener("pagehide", onHide);
    return () => {
      active = false;
      mounted.current = false;
      window.removeEventListener("pagehide", onHide);
      // Strict Mode remounts at once; only a real unmount stops the camera
      stopTimer.current = window.setTimeout(() => {
        if (!mounted.current) stopCamera(openRef.current);
      }, 0);
    };
  }, [camera]);

  // a still photo instead of the camera: object URL lifetime
  useEffect(() => {
    if (!photoUrl) return;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const source = (): FrameSource | null => sourceOf(status === "photo" ? imgRef.current : videoRef.current);

  const crop = (): CanvasRenderingContext2D | null => {
    if (!cropRef.current) {
      const c = document.createElement("canvas");
      c.width = DETECT_SIZE;
      c.height = DETECT_SIZE;
      cropRef.current = c.getContext("2d", { willReadFrequently: true });
    }
    return cropRef.current;
  };

  const lock = (src: FrameSource, m: Mapping, pose: BeanPose, again: boolean) => {
    const frame = grabFrame(src);
    videoRef.current?.pause();
    const { circle } = layoutRef.current;
    const ctx = crop();
    const frozen = { el: frame, w: frame.width, h: frame.height };
    const bean = (again && ctx && refine(frozen, m, circle, ctx, pose, REFINE_REACH * circle.r * 2 / m.k)) || pose;
    if (progressRef.current) progressRef.current.style.strokeDashoffset = "0";
    setStatus("locked");
    lockRef.current({ frame, bean, from: m, circle });
  };

  // the detector, about 12 times a second, off the drawing loop
  useEffect(() => {
    if (status !== "live" && status !== "photo") return;
    const checkMs: number[] = [];
    const tick = () => {
      const src = source();
      const ctx = crop();
      if (!src || !ctx) return;
      const { sw, sh, circle } = layoutRef.current;
      const m = coverMapping(src.w, src.h, sw, sh);
      mappingRef.current = m;
      const check = checkFrame(src, m, circle, ctx, trackRef.current, performance.now() / 1000);
      checkMs.push(check.ms);
      if (checkMs.length > CHECK_LOG) checkMs.shift();
      const open = openRef.current;
      if (open?.ok) open.fake?.setTarget(check.frameCircle);
      trackRef.current = check.step.state;
      poseRef.current = check.pose;
      drawReticle({ g: reticleRef.current, path: pathRef.current, ring: progressRef.current }, circle.r, check.pose, m, check.step.progress);
      if (check.step.locked && check.pose) {
        window.clearInterval(timer);
        lock(src, m, check.pose, true);
      }
    };
    const timer = window.setInterval(tick, CHECK_MS);
    const helpTimer = window.setTimeout(() => setHelp(true), HELP_AFTER_MS);
    window.__scanner = { checkMs, mapping: () => mappingRef.current, layout: () => layoutRef.current, pose: () => poseRef.current };
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(helpTimer);
    };
    // source() and lock() read refs only; the loop restarts when the status changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onTap = (e: PointerEvent<HTMLDivElement>) => {
    if (!tapMode || status === "locked") return;
    const src = source();
    const ctx = crop();
    const root = rootRef.current;
    if (!src || !ctx || !root) return;
    const box = root.getBoundingClientRect();
    const tap = { x: e.clientX - box.left, y: e.clientY - box.top };
    const { sw, sh, circle } = layoutRef.current;
    if (Math.hypot(tap.x - circle.x, tap.y - circle.y) > circle.r) return;
    const m = coverMapping(src.w, src.h, sw, sh);
    lock(src, m, poseAtTap(src, m, circle, ctx, unmapPoint(m, tap)), false);
  };

  const { sw, sh, circle: c } = layout;
  const ringLen = 2 * Math.PI * (c.r + 1.5);
  const hint =
    status === "starting"
      ? "Starting the camera…"
      : status === "photo-needed"
        ? message
        : status === "locked"
          ? "Got it!"
          : tapMode
            ? "Tap the bean inside the circle"
            : "Hold the bean in the circle, in good light";

  return (
    <div ref={rootRef} onPointerDown={onTap} className="fixed inset-0 z-[100] touch-none select-none overscroll-none text-white" style={{ background: SURROUND }}>
      <video ref={videoRef} playsInline muted autoPlay className={`absolute inset-0 h-full w-full object-cover ${status === "photo" ? "hidden" : ""}`} />
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob photo, read back by the detector
        <img ref={imgRef} src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onLoad={() => setStatus("photo")} />
      )}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ left: c.x - c.r, top: c.y - c.r, width: c.r * 2, height: c.r * 2, boxShadow: `0 0 0 200vmax ${SURROUND}` }}
      />
      <svg className="pointer-events-none absolute inset-0" width={sw} height={sh} aria-hidden>
        <circle cx={c.x} cy={c.y} r={c.r + 1.5} fill="none" stroke={RING_IDLE} strokeWidth={1.5} />
        <circle
          ref={progressRef}
          cx={c.x}
          cy={c.y}
          r={c.r + 1.5}
          fill="none"
          stroke={RING_LOCK}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={ringLen}
          strokeDashoffset={ringLen}
          transform={`rotate(-90 ${c.x} ${c.y})`}
          style={{ transition: "stroke-dashoffset 90ms linear" }}
        />
        <g ref={reticleRef} style={{ opacity: 0, transformOrigin: "0 0", transition: "transform 90ms linear, opacity 150ms" }}>
          <path ref={pathRef} fill="none" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      </svg>

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="flex flex-col">
          <p className="text-lg font-semibold">Find the bean</p>
          <p className="text-xs text-white/75">Demo: a bean stands in for a tick.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close the scanner" className="grid size-10 place-items-center rounded-full bg-white/15">
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div
        className="absolute inset-x-0 flex flex-col items-center gap-3 px-4 pb-[max(16px,env(safe-area-inset-bottom))] text-center"
        style={{ top: c.y + c.r + 18 }}
      >
        <p role="status" aria-live="polite" className="max-w-xs text-sm font-medium text-white/90">
          {hint}
        </p>
        {status === "photo-needed" && (
          <div className="w-full max-w-xs">
            <CameraCapture label="Use a photo" onCapture={(file) => setPhotoUrl(URL.createObjectURL(file))} />
          </div>
        )}
        {help && (status === "live" || status === "photo") && (
          <div className="flex w-full max-w-xs flex-col gap-2">
            <p className="text-xs text-white/70">Can&apos;t find it? Move closer, or:</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="h-11 flex-1" onClick={() => setTapMode(true)} disabled={tapMode}>
                Tap the bean
              </Button>
              <Button variant="outline" className="h-11 flex-1 text-foreground" onClick={() => onSample(c)}>
                Use the sample
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
