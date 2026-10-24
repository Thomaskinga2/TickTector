// Mappings between the camera frame, the screen and the 360x700 scene, and the opening that
// carries the viewfinder circle out to full screen. All mappings are scale + translate:
// screen = o + k * source. Screen units are CSS pixels of the viewport.
import { clamp, GROUND_Y, H, lerp, TICK, W } from "./timeline";

export type Mapping = { k: number; ox: number; oy: number };
export type Point = { x: number; y: number };
export type Circle = { x: number; y: number; r: number };
// scene -> screen: screen = o + s * scene. rect: the part of the scene plane the screen shows.
export type SceneView = {
  sw: number;
  sh: number;
  s: number;
  ox: number;
  oy: number;
  rect: { x0: number; y0: number; x1: number; y1: number };
};

// The viewfinder: share of the screen width, and its largest diameter in CSS px
export const VIEWFINDER_SHARE = 0.78;
export const VIEWFINDER_MAX = 340;
// Fixed camera-surface colours, shared by the scanner and the opening's first frame
export const SURROUND = "#0b0f0c";
export const RING_IDLE = "rgba(255,255,255,0.55)";
export const RING_LOCK = "#5cf08f";

export const mapPoint = (m: Mapping, p: Point): Point => ({ x: m.ox + m.k * p.x, y: m.oy + m.k * p.y });
export const unmapPoint = (m: Mapping, p: Point): Point => ({ x: (p.x - m.ox) / m.k, y: (p.y - m.oy) / m.k });

// object-fit: cover of a src image in a box placed at (bx, by)
export function coverMapping(srcW: number, srcH: number, boxW: number, boxH: number, bx = 0, by = 0): Mapping {
  const k = Math.max(boxW / srcW, boxH / srcH);
  return { k, ox: bx + (boxW - srcW * k) / 2, oy: by + (boxH - srcH * k) / 2 };
}

// The on-screen circle in source pixels
export function circleInSource(m: Mapping, screen: Circle): Circle {
  const c = unmapPoint(m, screen);
  return { x: c.x, y: c.y, r: screen.r / m.k };
}

export function sceneView(sw: number, sh: number): SceneView {
  const s = Math.min(sw / W, sh / H);
  const ox = (sw - W * s) / 2;
  const oy = (sh - H * s) / 2;
  return { sw, sh, s, ox, oy, rect: { x0: -ox / s, y0: -oy / s, x1: (sw - ox) / s, y1: (sh - oy) / s } };
}

const farthestCorner = (x: number, y: number, x0: number, y0: number, x1: number, y1: number): number =>
  Math.max(Math.hypot(x - x0, y - y0), Math.hypot(x - x1, y - y0), Math.hypot(x - x0, y - y1), Math.hypot(x - x1, y - y1));

// Paper wipe radius (scene px) that covers every visible corner from the vial
export function wipeRadius(v: SceneView): number {
  return Math.max(440, farthestCorner(TICK.x, GROUND_Y, v.rect.x0, v.rect.y0, v.rect.x1, v.rect.y1));
}

// frame -> screen for the animation: the same scale as the viewfinder's cover (so the opening
// only slides the photo), moved so the tick lands on the scene's tick point
export function tickFraming(frameW: number, frameH: number, at: Point, v: SceneView): Mapping {
  const k = Math.max(v.sw / frameW, v.sh / frameH);
  return { k, ox: v.ox + v.s * TICK.x - k * at.x, oy: v.oy + v.s * TICK.y - k * at.y };
}

// Between the viewfinder framing (e = 0) and the scene framing (e = 1): scale moves geometrically
// and the anchor (the tick) moves in a straight line, so nothing slides off the eye's path.
export function blendMapping(from: Mapping, to: Mapping, anchor: Point, e: number): Mapping {
  const k = Math.exp(lerp(Math.log(from.k), Math.log(to.k), e));
  const a0 = mapPoint(from, anchor);
  const a1 = mapPoint(to, anchor);
  const ax = lerp(a0.x, a1.x, e);
  const ay = lerp(a0.y, a1.y, e);
  return { k, ox: ax - k * anchor.x, oy: ay - k * anchor.y };
}

// The clip circle rides with the photo and grows until it covers the screen corners
export function openingClip(circleSrc: Circle, m: Mapping, r0: number, e: number, sw: number, sh: number): Circle {
  const c = mapPoint(m, circleSrc);
  const cover = farthestCorner(c.x, c.y, 0, 0, sw, sh) + 2;
  return { x: c.x, y: c.y, r: lerp(r0, cover, clamp(e)) };
}

// Viewfinder circle for a viewport: centred, a little above the middle to leave room for the hint
export function viewfinderCircle(sw: number, sh: number): Circle {
  const r = Math.min(sw * VIEWFINDER_SHARE, VIEWFINDER_MAX) / 2;
  return { x: sw / 2, y: Math.min(sh * 0.46, sh / 2), r };
}
