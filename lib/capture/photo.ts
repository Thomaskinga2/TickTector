// Frames and crops taken from the camera or a still photo: the tracker's crop, the frozen frame
// with the simulated tick laid on it, the Tickdex thumbnail, and the file sent to /api/scan.
import { drawTickOnSurface, type Tick3dLook } from "./draw-tick-3d";
import type { Circle, Point } from "./framing";

export type FrameSource = { el: CanvasImageSource; w: number; h: number };

const THUMB_SIZE = 240;
const THUMB_QUALITY = 0.7;
const THUMB_SIDE = 3.4; // thumbnail side, in adult tick lengths at this framing
const TICK_LEN = 54; // an adult tick, legs included, in tick units
const UPLOAD_QUALITY = 0.85;

export function sourceOf(el: HTMLVideoElement | HTMLImageElement | null): FrameSource | null {
  if (!el) return null;
  if (el instanceof HTMLVideoElement) {
    if (el.readyState < 2 || !el.videoWidth) return null;
    return { el, w: el.videoWidth, h: el.videoHeight };
  }
  if (!el.complete || !el.naturalWidth) return null;
  return { el, w: el.naturalWidth, h: el.naturalHeight };
}

// The square around a circle (in source pixels) drawn into out, which is size x size.
// Parts of the square past the source's edges stay transparent.
export function cropCircle(src: FrameSource, circle: Circle, out: CanvasRenderingContext2D, size: number): void {
  const s0x = circle.x - circle.r;
  const s0y = circle.y - circle.r;
  const side = circle.r * 2;
  const k = size / side;
  const x0 = Math.max(0, s0x);
  const y0 = Math.max(0, s0y);
  const x1 = Math.min(src.w, s0x + side);
  const y1 = Math.min(src.h, s0y + side);
  out.clearRect(0, 0, size, size);
  if (x1 <= x0 || y1 <= y0) return;
  out.drawImage(src.el, x0, y0, x1 - x0, y1 - y0, (x0 - s0x) * k, (y0 - s0y) * k, (x1 - x0) * k, (y1 - y0) * k);
}

export function grabFrame(src: FrameSource): HTMLCanvasElement {
  const frame = document.createElement("canvas");
  frame.width = src.w;
  frame.height = src.h;
  frame.getContext("2d", { willReadFrequently: true })?.drawImage(src.el, 0, 0, src.w, src.h);
  return frame;
}

// The frozen frame with the simulated tick laid on it. unit: frame pixels per tick unit.
export function withTick(clean: HTMLCanvasElement, at: Point, look: Tick3dLook, unit: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = clean.width;
  out.height = clean.height;
  const c = out.getContext("2d");
  if (c) {
    c.drawImage(clean, 0, 0);
    drawTickOnSurface(c, at.x, at.y, look, unit);
  }
  return out;
}

// A small square JPEG around the tick, for the Tickdex
export function thumbnail(frame: HTMLCanvasElement, at: Point, unit: number): string {
  const side = Math.min(Math.max(TICK_LEN * THUMB_SIDE * unit, 64), frame.width, frame.height);
  const x = Math.min(Math.max(at.x - side / 2, 0), frame.width - side);
  const y = Math.min(Math.max(at.y - side / 2, 0), frame.height - side);
  const out = document.createElement("canvas");
  out.width = THUMB_SIZE;
  out.height = THUMB_SIZE;
  out.getContext("2d")?.drawImage(frame, x, y, side, side, 0, 0, THUMB_SIZE, THUMB_SIZE);
  return out.toDataURL("image/jpeg", THUMB_QUALITY);
}

export function canvasToFile(canvas: HTMLCanvasElement, name = "scan.jpg"): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(new File([blob], name, { type: "image/jpeg" })) : reject(new Error("Could not encode the photo"))),
      "image/jpeg",
      UPLOAD_QUALITY,
    );
  });
}
