"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { CameraCapture } from "@/components/camera-capture";
import { Button } from "@/components/ui/button";
import { stopCamera, type CameraOpen } from "@/lib/capture/camera";
import { drawTickOnSurface, lookFor } from "@/lib/capture/draw-tick-3d";
import {
  circleInSource,
  coverMapping,
  mapPoint,
  RING_IDLE,
  RING_LOCK,
  sceneView,
  SURROUND,
  VIEWFINDER_TICK_ZOOM,
  viewfinderCircle,
  type Circle,
  type Mapping,
  type Point,
} from "@/lib/capture/framing";
import { cropCircle, grabFrame, sourceOf, withTick, type FrameSource } from "@/lib/capture/photo";
import { estimateShift, greyCrop, SURFACE_TRACKER } from "@/lib/capture/surface-tracker";
import { eOut, lerp, seg } from "@/lib/capture/timeline";
import type { SimTick } from "@/lib/capture/tick-sim";

// clean: the frozen frame; withTick: the same with the simulated tick laid on it.
// at: the tick in frame pixels; unit: frame pixels per tick unit.
export type ScannerLock = { clean: HTMLCanvasElement; withTick: HTMLCanvasElement; at: Point; unit: number; from: Mapping; circle: Circle };

type Props = {
  camera: Promise<CameraOpen>;
  sim: SimTick;
  onLock: (lock: ScannerLock) => void;
  onSample: (circle: Circle) => void;
  onClose: () => void;
};

type Status = "starting" | "live" | "photo-needed" | "photo" | "locked";
type Search = "searching" | "found";
type Layout = { sw: number; sh: number; circle: Circle };

// The search: the reticle sweeps, finds the tick, glides onto it, then holds while the ring fills
const FIND_FROM = 1.0;
const FIND_SPREAD = 0.6;
const GLIDE_S = 0.3;
const HOLD_S = 0.5;
const FADE_IN_S = 0.3;
const TRACK_MS = 80; // surface tracker checks, about 12 a second
const TRACK_SIDE = 1.3; // tracker crop side, in circle radii
const MAX_DRIFT = 0.55; // the tick never wanders further than this share of the radius
const FOLLOW = 0.35; // how quickly the drawn tick catches up with the tracked surface, per frame
const MAX_DPR = 3;
const SWEEP_TURNS = 0.9; // radar sweep, turns per second

declare global {
  interface Window {
    __scanner?: {
      mapping: () => Mapping | null;
      at: () => Point | null;
      offset: () => Point;
      trackMs: number[];
      seek: (tau: number | null) => void; // testing: hold the search at tau seconds (null resumes)
      lockAt: number;
    };
  }
}

const layoutFor = (sw: number, sh: number): Layout => ({ sw, sh, circle: viewfinderCircle(sw, sh) });

// Corner brackets around the tick, centred on the origin (the group is moved and turned)
function bracketPath(hx: number, hy: number): string {
  const k = Math.min(hx, hy) * 0.55;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    .map(([sx, sy]) => `M${sx * hx - sx * k},${sy * hy} L${sx * hx},${sy * hy} L${sx * hx},${sy * hy - sy * k}`)
    .join(" ");
}

// A different, stable moment of discovery for each simulated tick
const findAtFor = (sim: SimTick): number => FIND_FROM + FIND_SPREAD * (Math.abs(Math.sin(sim.dx * 91.7 + sim.dy * 37.3)) % 1);

// The live scan: the camera (or a still photo) through a round viewfinder, the simulated tick
// drawn on the surface and kept there by a tracker, a reticle that searches and locks on.
// The surround is a fixed dark camera surface in both themes, so its text is fixed white.
export function TickScanner({ camera, sim, onLock, onSample, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const reticleRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<CameraOpen | null>(null);
  const mounted = useRef(false);
  const stopTimer = useRef(0);
  const [layout, setLayout] = useState<Layout>(() => layoutFor(window.innerWidth, window.innerHeight));
  const layoutRef = useRef(layout);
  const [status, setStatus] = useState<Status>("starting");
  const [search, setSearch] = useState<Search>("searching");
  const [message, setMessage] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
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

  useEffect(() => {
    if (!photoUrl) return;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  // the scan: draw the tick on the surface every frame, track the surface, search, lock
  useEffect(() => {
    if (status !== "live" && status !== "photo") return;
    const overlay = overlayRef.current;
    const octx = overlay?.getContext("2d");
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = SURFACE_TRACKER.SIZE;
    cropCanvas.height = SURFACE_TRACKER.SIZE;
    const crop = cropCanvas.getContext("2d", { willReadFrequently: true });
    if (!overlay || !octx || !crop) return;
    const look = lookFor(sim);
    const findAt = findAtFor(sim);
    const source = (): FrameSource | null => sourceOf(status === "photo" ? imgRef.current : videoRef.current);
    const offset = { x: 0, y: 0 }; // tracked surface motion, frame pixels
    const shown = { x: 0, y: 0 }; // what is drawn, easing after it
    let prev: Float32Array | null = null;
    let mapping: Mapping | null = null;
    let at: Point | null = null;
    let start = 0;
    let raf = 0;
    let done = false;
    let found = false;
    let fixedTau: number | null = null;
    const trackMs: number[] = [];

    const track = () => {
      const src = source();
      if (!src || !mapping) return;
      const t0 = performance.now();
      const fc = circleInSource(mapping, layoutRef.current.circle);
      const side = fc.r * TRACK_SIDE;
      cropCircle(src, { x: fc.x, y: fc.y, r: side / 2 }, crop, SURFACE_TRACKER.SIZE);
      const { grey, texture } = greyCrop(crop.getImageData(0, 0, SURFACE_TRACKER.SIZE, SURFACE_TRACKER.SIZE));
      if (prev) {
        const shift = estimateShift(prev, grey, SURFACE_TRACKER.SIZE, texture);
        if (shift.confident) {
          const k = side / SURFACE_TRACKER.SIZE;
          offset.x += shift.dx * k;
          offset.y += shift.dy * k;
          const d = Math.hypot(offset.x, offset.y);
          const max = MAX_DRIFT * fc.r;
          if (d > max) {
            offset.x *= max / d;
            offset.y *= max / d;
          }
        }
      }
      prev = grey;
      trackMs.push(performance.now() - t0);
      if (trackMs.length > 300) trackMs.shift();
    };

    const lock = (src: FrameSource, m: Mapping, p: Point, unit: number) => {
      done = true;
      const clean = grabFrame(src);
      videoRef.current?.pause();
      setStatus("locked");
      lockRef.current({ clean, withTick: withTick(clean, p, look, unit), at: p, unit, from: m, circle: layoutRef.current.circle });
    };

    const frame = (now: number) => {
      if (done) return;
      raf = requestAnimationFrame(frame);
      const src = source();
      if (!src) return;
      if (!start) start = now;
      const tau = fixedTau ?? (now - start) / 1000;
      const { sw, sh, circle } = layoutRef.current;
      const m = coverMapping(src.w, src.h, sw, sh);
      mapping = m;
      const fc = circleInSource(m, circle);
      shown.x += (offset.x - shown.x) * FOLLOW;
      shown.y += (offset.y - shown.y) * FOLLOW;
      at = { x: fc.x + sim.dx * fc.r + shown.x, y: fc.y + sim.dy * fc.r + shown.y };
      const unitScreen = sceneView(sw, sh).s * VIEWFINDER_TICK_ZOOM;
      const p = mapPoint(m, at);
      // the tick on the surface
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      if (overlay.width !== Math.round(sw * dpr)) overlay.width = Math.round(sw * dpr);
      if (overlay.height !== Math.round(sh * dpr)) overlay.height = Math.round(sh * dpr);
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.clearRect(0, 0, sw, sh);
      drawTickOnSurface(octx, p.x, p.y, look, unitScreen, seg(tau, 0, FADE_IN_S));
      // the reticle: sweep, glide onto the tick, hold
      // while searching, the bracket rides the radar sweep's leading edge, in and out a little
      const turn = tau * SWEEP_TURNS * Math.PI * 2;
      const reach = circle.r * (0.45 + 0.15 * Math.sin(tau * 2.3));
      const sweep = { x: circle.x + reach * Math.sin(turn), y: circle.y - reach * Math.cos(turn) };
      const g = eOut(seg(tau, findAt, findAt + GLIDE_S));
      const tickH = { x: (30 * look.scale + 4) * unitScreen + 4, y: (30 * look.scale + 4) * unitScreen + 4 };
      const hx = lerp(circle.r * 0.16, tickH.x, g);
      const hy = lerp(circle.r * 0.16, tickH.y, g);
      const rx = lerp(sweep.x, p.x, g);
      const ry = lerp(sweep.y, p.y, g);
      const progress = seg(tau, findAt + GLIDE_S, findAt + GLIDE_S + HOLD_S);
      const gEl = reticleRef.current;
      const path = pathRef.current;
      if (gEl && path) {
        gEl.style.opacity = String(seg(tau, 0.15, 0.45));
        gEl.style.transform = `translate(${rx}px, ${ry}px) rotate(${lerp(turn, look.angle, g)}rad)`;
        path.setAttribute("d", bracketPath(hx, hy));
        path.setAttribute("stroke", g >= 1 ? RING_LOCK : "#ffffff");
      }
      const sweepEl = sweepRef.current;
      if (sweepEl) {
        // the radar sweep turns while searching and fades as the reticle glides onto the tick
        sweepEl.style.transform = `rotate(${tau * SWEEP_TURNS * 360}deg)`;
        sweepEl.style.opacity = String(seg(tau, 0.1, 0.4) * (1 - g));
      }
      if (progressRef.current) progressRef.current.style.strokeDashoffset = String(2 * Math.PI * (circle.r + 1.5) * (1 - progress));
      if (!found && tau >= findAt) {
        found = true;
        setSearch("found");
      }
      if (progress >= 1) lock(src, m, at, unitScreen / m.k);
    };

    raf = requestAnimationFrame(frame);
    const timer = window.setInterval(track, TRACK_MS);
    window.__scanner = {
      mapping: () => mapping,
      at: () => at,
      offset: () => ({ ...offset }),
      trackMs,
      seek: (tau) => {
        fixedTau = tau;
      },
      lockAt: findAt + GLIDE_S + HOLD_S,
    };
    return () => {
      done = true;
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
    };
  }, [status, sim]);

  const { sw, sh, circle: c } = layout;
  const ringLen = 2 * Math.PI * (c.r + 1.5);
  const hint =
    status === "starting"
      ? "Starting the camera…"
      : status === "photo-needed"
        ? message
        : status === "locked"
          ? "Got it!"
          : search === "found"
            ? "Tick found! Hold still…"
            : "Scanning for the tick…";

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] touch-none select-none overscroll-none text-white" style={{ background: SURROUND }}>
      <video ref={videoRef} playsInline muted autoPlay className={`absolute inset-0 h-full w-full object-cover ${status === "photo" ? "hidden" : ""}`} />
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob photo, read back by the tracker
        <img ref={imgRef} src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onLoad={() => setStatus("photo")} />
      )}
      <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <div
        ref={sweepRef}
        className="pointer-events-none absolute rounded-full opacity-0"
        style={{
          left: c.x - c.r,
          top: c.y - c.r,
          width: c.r * 2,
          height: c.r * 2,
          background: `conic-gradient(from 0deg, transparent 0deg 280deg, ${RING_LOCK}00 280deg, ${RING_LOCK}38 358deg, ${RING_LOCK}b0 360deg)`,
        }}
      />
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
        />
        <g ref={reticleRef} style={{ opacity: 0, transformOrigin: "0 0" }}>
          <path ref={pathRef} fill="none" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      </svg>

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="flex flex-col">
          <p className="text-lg font-semibold">Scan your tick</p>
          <p className="text-xs text-white/75">Demo: a simulated tick appears on whatever you point at.</p>
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
          <div className="flex w-full max-w-xs flex-col gap-2">
            <CameraCapture label="Use a photo" onCapture={(file) => setPhotoUrl(URL.createObjectURL(file))} />
            <Button variant="outline" className="h-11 text-foreground" onClick={() => onSample(c)}>
              Use the sample
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
