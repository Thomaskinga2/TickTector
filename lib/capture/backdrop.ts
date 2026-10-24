// What sits behind the capture scene: a painted sheet of paper ("Use the sample") or the frozen
// camera frame placed so the simulated tick's spot lands on the tick point. Both are painted once,
// at full resolution, over the whole screen. Fixed game colours (see draw-kit.ts).
import type { Ctx } from "./draw-kit";
import type { Mapping, SceneView } from "./framing";
import { paintSurface } from "./surfaces";
import { H, W } from "./timeline";

// Photo grade: a light scrim and a camera vignette, so white overlays read on a pale surface
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

// Draws img with mapping m and fills the rest of [0,sw]x[0,sh] with the image mirrored across
// its edges (the texture carries on, where stretched edge pixels would show as streaks), so a
// tick near the frame's edge never leaves black bands. c is in CSS px.
export function drawClamped(c: Ctx, img: CanvasImageSource, iw: number, ih: number, m: Mapping, sw: number, sh: number): void {
  const x0 = m.ox;
  const y0 = m.oy;
  const w = iw * m.k;
  const h = ih * m.k;
  for (const ty of [-1, 0, 1]) {
    for (const tx of [-1, 0, 1]) {
      // the mirrored copy next to the image on this side, if any of it is on screen
      const left = x0 + tx * w;
      const top = y0 + ty * h;
      if (left >= sw || left + w <= 0 || top >= sh || top + h <= 0) continue;
      c.save();
      c.translate(tx === 0 ? 0 : 2 * (tx < 0 ? x0 : x0 + w), ty === 0 ? 0 : 2 * (ty < 0 ? y0 : y0 + h));
      c.scale(tx === 0 ? 1 : -1, ty === 0 ? 1 : -1);
      c.drawImage(img, x0, y0, w, h);
      c.restore();
    }
  }
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

// The sample: a sheet of paper filling the screen, graded like a photo
export function paintSample(v: SceneView, dpr: number): HTMLCanvasElement {
  const off = paintSurface("paper", v.sw * dpr, v.sh * dpr, 11, dpr);
  gradePhoto(context(off), v, dpr, 1);
  return off;
}
