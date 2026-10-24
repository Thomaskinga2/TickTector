"use client";

import { useEffect, useRef } from "react";
import { paintForearm, paintPhoto, ringMedian } from "@/lib/capture/backdrop";
import { makeDiagramSprites } from "@/lib/capture/diagram-sprites";
import type { DiagramInfo } from "@/lib/capture/diagram-caption";
import { renderFrame, type Opening, type SceneAssets, type SceneText } from "@/lib/capture/draw-scene";
import { CAPTURE_FONTS, captureFontVars, loadCaptureFonts } from "@/lib/capture/fonts";
import { circleInSource, sceneFraming, sceneView, wipeRadius, type BeanPose, type Circle, type Mapping } from "@/lib/capture/framing";
import { advanceClock, DROP, makeTimeline, OPEN_LEN, type Timeline } from "@/lib/capture/timeline";

// What the scanner locked on: the frozen frame with the bean, or the painted-forearm sample.
// circle: the viewfinder circle on screen; from: the frame's on-screen (object-fit cover) mapping.
export type CaptureSource =
  | { kind: "photo"; frame: HTMLCanvasElement; bean: BeanPose; from: Mapping; circle: Circle }
  | { kind: "sample"; circle: Circle };

export type CatchKind = "full" | "quick";

type Props = {
  source: CaptureSource;
  text: Omit<SceneText, "diagram"> & { diagram: Omit<DiagramInfo, "heading"> };
  hasResult: boolean; // the API answered (or fell back)
  catchKind: CatchKind | null; // known once the result is in; the clock fixes it before the drop
  onReady: () => void; // first frame is on screen
  onShutter: () => void; // the shutter flash: send the photo now
  onCaught: () => string; // CAUGHT!: record the catch, return the diagram heading
  onFinished: () => void;
  showSkip?: boolean;
};

const MAX_DPR = 3;
const MAX_DT = 0.05;
const FRAME_LOG = 600;

type Clock = { T: number; L: Timeline | null; shutter: boolean; caught: boolean; finished: boolean; skip: boolean; paused: boolean };

declare global {
  interface Window {
    __capture?: { seek: (T: number) => void; pause: (p: boolean) => void; state: () => object; frameMs: number[] };
  }
}

function buildAssets(source: CaptureSource, canvas: HTMLCanvasElement) {
  const sw = canvas.clientWidth || window.innerWidth;
  const sh = canvas.clientHeight || window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const view = sceneView(sw, sh);
  canvas.width = Math.round(sw * dpr);
  canvas.height = Math.round(sh * dpr);
  const base = { view, dpr, fonts: CAPTURE_FONTS, sprites: makeDiagramSprites(dpr), wipeR: wipeRadius(view) };
  if (source.kind === "sample") {
    const backdrop = paintForearm(view, dpr);
    const unit = { k: 1 / dpr, ox: 0, oy: 0 };
    const c = source.circle;
    const opening: Opening = {
      source: backdrop,
      srcW: backdrop.width,
      srcH: backdrop.height,
      from: unit,
      to: unit,
      anchor: { x: 0, y: 0 },
      circleSrc: { x: c.x * dpr, y: c.y * dpr, r: c.r * dpr },
      r0: c.r,
      graded: false,
    };
    return { assets: { ...base, backdrop, erased: null } as SceneAssets, opening };
  }
  const { frame, bean, from, circle } = source;
  const to = sceneFraming(frame.width, frame.height, bean, view);
  const backdrop = paintPhoto(frame, to, view, dpr, null, null);
  const erased = paintPhoto(frame, to, view, dpr, bean, ringMedian(frame, bean));
  const opening: Opening = {
    source: frame,
    srcW: frame.width,
    srcH: frame.height,
    from,
    to,
    anchor: { x: bean.x, y: bean.y },
    circleSrc: circleInSource(from, circle),
    r0: circle.r,
    graded: true,
  };
  return { assets: { ...base, backdrop, erased } as SceneAssets, opening };
}

// The Tickdex capture animation on one clock: one canvas, one requestAnimationFrame loop,
// every frame drawn from the time value alone. Full screen, over the bottom nav.
export function CaptureAnimation(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  const clock = useRef<Clock>({ T: 0, L: null, shutter: false, caught: false, finished: false, skip: false, paused: false });
  const headingRef = useRef("TICKDEX");

  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ck = clock.current;
    if (reduced) {
      // no opening and no animation: the open frame, then the finished diagram once the result is in
      ck.T = Math.max(ck.T, OPEN_LEN);
      ck.skip = true;
    }
    let built = buildAssets(propsRef.current.source, canvas);
    let raf = 0;
    let last = 0;
    let cancelled = false;
    let ready = false;
    const frameMs: number[] = [];

    const decide = (t: number): Timeline | null => {
      if (ck.L) return ck.L;
      const kind = propsRef.current.catchKind;
      if (kind) ck.L = makeTimeline(kind === "quick");
      else if (t >= DROP) ck.L = makeTimeline(false); // late answer: play full, hold on the wobbles
      return ck.L;
    };

    const step = (dt: number) => {
      const p = propsRef.current;
      const L = decide(ck.T - OPEN_LEN) ?? makeTimeline(false);
      if (!ck.paused) ck.T = advanceClock(ck.T, dt, L, p.hasResult);
      if (ck.skip && p.hasResult && ck.T >= OPEN_LEN) {
        const fixed = decide(Infinity) ?? L;
        ck.T = OPEN_LEN + fixed.end;
      }
      const t = ck.T - OPEN_LEN;
      if (!ck.shutter && t >= 0) {
        ck.shutter = true;
        p.onShutter();
      }
      if (!ck.caught && ck.L && t >= ck.L.click) {
        ck.caught = true;
        headingRef.current = p.onCaught();
      }
      if (!ck.finished && ck.L && t >= ck.L.end) {
        ck.finished = true;
        p.onFinished();
      }
    };

    const draw = () => {
      const p = propsRef.current;
      const L = ck.L ?? makeTimeline(false);
      const text: SceneText = { ...p.text, diagram: { ...p.text.diagram, heading: headingRef.current } };
      renderFrame(ctx, ck.T, L, built.assets, text, built.opening);
    };

    const frame = (now: number) => {
      if (cancelled) return;
      const dt = last ? Math.min(MAX_DT, (now - last) / 1000) : 0;
      last = now;
      const t0 = performance.now();
      step(dt);
      draw();
      frameMs.push(performance.now() - t0);
      if (frameMs.length > FRAME_LOG) frameMs.shift();
      if (!ready) {
        ready = true;
        propsRef.current.onReady();
      }
      raf = requestAnimationFrame(frame);
    };

    loadCaptureFonts().then(() => {
      if (!cancelled) raf = requestAnimationFrame(frame);
    });

    const onResize = () => {
      built = buildAssets(propsRef.current.source, canvas);
    };
    window.addEventListener("resize", onResize);
    window.__capture = {
      seek: (T: number) => {
        ck.T = T;
        ck.paused = true;
      },
      pause: (p: boolean) => {
        ck.paused = p;
      },
      state: () => ({ T: ck.T, quick: ck.L?.quick ?? null, end: ck.L ? ck.L.end + OPEN_LEN : null, caught: ck.caught }),
      frameMs,
    };
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      delete window.__capture;
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] touch-none overscroll-none ${captureFontVars}`}>
      <canvas ref={canvasRef} className="block h-full w-full" role="img" aria-label="Capture animation: the tick is caught in a vial, then its life cycle" />
      {props.showSkip !== false && (
        <button
          type="button"
          onClick={() => {
            clock.current.skip = true;
          }}
          className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] rounded-full bg-background/80 px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm"
        >
          Skip
        </button>
      )}
    </div>
  );
}
