// What sits behind the capture scene: the painted forearm ("Use the sample") or the frozen
// camera frame placed so the simulated tick's spot lands on the tick point. Both are painted once, at full
// resolution, over the whole screen. Fixed game colours (see draw-kit.ts).
import { rng, type Ctx } from "./draw-kit";
import type { Mapping, SceneView } from "./framing";
import { H, TICK, W } from "./timeline";

// Photo grade: a light scrim and the forearm's camera vignette, so white overlays read on paper
const PHOTO_SCRIM = 0.16;

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(w));
  off.height = Math.max(1, Math.round(h));
  return off;
}

function context(off: HTMLCanvasElement): Ctx {
  const c = off.getContext("2d");
  if (!c) throw new Error("Canvas 2D is not available");
  return c;
}

// The camera vignette, in scene units over the visible rect
function vignette(c: Ctx, v: SceneView, alpha: number): void {
  const { x0, y0, x1, y1 } = v.rect;
  const vg = c.createRadialGradient(W / 2, H * 0.45, 120, W / 2, H * 0.45, 470);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, `rgba(40,15,5,${0.45 * alpha})`);
  c.fillStyle = vg;
  c.fillRect(x0, y0, x1 - x0, y1 - y0);
}

// Close-up of a forearm, as if seen through the phone camera
export function paintForearm(v: SceneView, dpr: number): HTMLCanvasElement {
  const off = makeCanvas(v.sw * dpr, v.sh * dpr);
  const c = context(off);
  c.setTransform(dpr * v.s, 0, 0, dpr * v.s, dpr * v.ox, dpr * v.oy);
  const { x0, y0, x1, y1 } = v.rect;
  const R = rng(7);
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#eabf9c");
  g.addColorStop(0.55, "#dfa983");
  g.addColorStop(1, "#c98c68");
  c.fillStyle = g;
  c.fillRect(x0, y0, x1 - x0, y1 - y0);
  // soft forearm curvature: lit ridge down the middle, falloff to the edges
  const ridge = c.createLinearGradient(0, 0, W, 0);
  ridge.addColorStop(0, "rgba(120,60,40,.28)");
  ridge.addColorStop(0.45, "rgba(255,235,215,.18)");
  ridge.addColorStop(1, "rgba(110,55,35,.32)");
  c.fillStyle = ridge;
  c.fillRect(x0, y0, x1 - x0, y1 - y0);
  // creases
  c.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const y = 60 + R() * (H - 120);
    const x = R() * W;
    c.strokeStyle = "rgba(140,75,50,.16)";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x - 50, y);
    c.quadraticCurveTo(x, y + (R() - 0.5) * 14, x + 60, y + (R() - 0.5) * 10);
    c.stroke();
  }
  pores(c, R, 0, 0, W, H, 900);
  hairs(c, R, 0, 0, W, H, 140);
  // the screen may show more than the 360x700 scene: keep the skin going past its edges
  const extra = (x1 - x0) * (y1 - y0) - W * H;
  if (extra > 1) {
    const R2 = rng(8);
    const share = extra / (W * H);
    const inScene = (x: number, y: number) => x >= 0 && x <= W && y >= 0 && y <= H;
    pores(c, R2, x0, y0, x1 - x0, y1 - y0, Math.round(900 * (1 + share)), inScene);
    hairs(c, R2, x0, y0, x1 - x0, y1 - y0, Math.round(140 * (1 + share)), inScene);
  }
  vignette(c, v, 1);
  return off;
}

type Skip = (x: number, y: number) => boolean;

function pores(c: Ctx, R: () => number, x: number, y: number, w: number, h: number, n: number, skip?: Skip): void {
  for (let i = 0; i < n; i++) {
    const alpha = 0.08 + R() * 0.12;
    const px = x + R() * w;
    const py = y + R() * h;
    const r = 0.5 + R() * 0.9;
    if (skip?.(px, py)) continue;
    c.fillStyle = `rgba(130,70,45,${alpha})`;
    c.beginPath();
    c.arc(px, py, r, 0, Math.PI * 2);
    c.fill();
  }
}

// fine arm hair, combed diagonally
function hairs(c: Ctx, R: () => number, x0: number, y0: number, w: number, h: number, n: number, skip?: Skip): void {
  for (let i = 0; i < n; i++) {
    const x = x0 + R() * w;
    const y = y0 + R() * h;
    const len = 10 + R() * 16;
    const a = 0.9 + (R() - 0.5) * 0.5;
    if (Math.hypot(x - TICK.x, y - TICK.y) < 40 || skip?.(x, y)) continue;
    c.strokeStyle = `rgba(70,40,25,${0.25 + R() * 0.25})`;
    c.lineWidth = 0.7 + R() * 0.5;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 2, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    c.stroke();
  }
}

// Draws img with mapping m and stretches its edge pixels to fill the rest of [0,sw]x[0,sh],
// so a tick near the frame's edge never leaves black bands. c is in CSS px.
export function drawClamped(c: Ctx, img: CanvasImageSource, iw: number, ih: number, m: Mapping, sw: number, sh: number): void {
  const x0 = m.ox;
  const y0 = m.oy;
  const x1 = m.ox + iw * m.k;
  const y1 = m.oy + ih * m.k;
  const o = 0.5; // overlap so no seam shows between a strip and the image
  if (x0 > 0) c.drawImage(img, 0, 0, 1, ih, 0, y0, x0 + o, y1 - y0);
  if (x1 < sw) c.drawImage(img, iw - 1, 0, 1, ih, x1 - o, y0, sw - x1 + o, y1 - y0);
  if (y0 > 0) c.drawImage(img, 0, 0, iw, 1, x0, 0, x1 - x0, y0 + o);
  if (y1 < sh) c.drawImage(img, 0, ih - 1, iw, 1, x0, y1 - o, x1 - x0, sh - y1 + o);
  if (x0 > 0 && y0 > 0) c.drawImage(img, 0, 0, 1, 1, 0, 0, x0 + o, y0 + o);
  if (x1 < sw && y0 > 0) c.drawImage(img, iw - 1, 0, 1, 1, x1 - o, 0, sw - x1 + o, y0 + o);
  if (x0 > 0 && y1 < sh) c.drawImage(img, 0, ih - 1, 1, 1, 0, y1 - o, x0 + o, sh - y1 + o);
  if (x1 < sw && y1 < sh) c.drawImage(img, iw - 1, ih - 1, 1, 1, x1 - o, y1 - o, sw - x1 + o, sh - y1 + o);
  c.drawImage(img, x0, y0, x1 - x0, y1 - y0);
}

// The scrim and vignette laid over the photo; amount 0..1 fades them in during the opening
export function gradePhoto(c: Ctx, v: SceneView, dpr: number, amount: number): void {
  if (amount <= 0) return;
  c.save();
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = `rgba(10,12,8,${PHOTO_SCRIM * amount})`;
  c.fillRect(0, 0, v.sw, v.sh);
  c.setTransform(dpr * v.s, 0, 0, dpr * v.s, dpr * v.ox, dpr * v.oy);
  vignette(c, v, amount);
  c.restore();
}

// The clean photo (no tick) in its scene framing, graded
export function paintPhoto(frame: HTMLCanvasElement, m: Mapping, v: SceneView, dpr: number): HTMLCanvasElement {
  const off = makeCanvas(v.sw * dpr, v.sh * dpr);
  const c = context(off);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawClamped(c, frame, frame.width, frame.height, m, v.sw, v.sh);
  gradePhoto(c, v, dpr, 1);
  return off;
}
