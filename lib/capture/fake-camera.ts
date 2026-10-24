// A stand-in camera for testing without a phone: /scan?fakeCamera=1 (a random surface), or
// paper, wood, stone, or still (no motion). A 1280x720 canvas stream of a plain surface seen up
// close, with sensor noise, a slow drift of the whole picture and hand shake, so the surface
// tracker has something to follow.
import { paintSurface, SURFACES, type Surface } from "./surfaces";
// Loaded with a dynamic import, so it is not in the normal bundle.

export type FakeCamera = {
  stream: MediaStream;
  offset: () => { x: number; y: number }; // how far the picture has moved, in frame pixels
  stop: () => void;
};

const FW = 1280;
const FH = 720;
const FPS = 30;
const PAD = 60; // the surface is painted this much larger than the frame, so drift never shows an edge
const DRIFT = 26; // slow drift, frame pixels
const NOISE_TILES = 4;

declare global {
  interface Window {
    __fakeCamera?: FakeCamera;
  }
}

function rand(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function noiseTile(seed: number): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = 256;
  off.height = 256;
  const c = off.getContext("2d");
  if (!c) return off;
  const img = c.createImageData(256, 256);
  const R = rand(seed);
  for (let k = 0; k < img.data.length; k += 4) {
    const v = R() < 0.5 ? 0 : 255;
    img.data[k] = v;
    img.data[k + 1] = v;
    img.data[k + 2] = v;
    img.data[k + 3] = Math.floor(R() * 28);
  }
  c.putImageData(img, 0, 0);
  return off;
}

export function startFakeCamera(mode: string): FakeCamera {
  const still = mode === "still";
  const kind: Surface = (SURFACES as readonly string[]).includes(mode) ? (mode as Surface) : SURFACES[Math.floor(Math.random() * SURFACES.length)];
  const canvas = document.createElement("canvas");
  canvas.width = FW;
  canvas.height = FH;
  const c = canvas.getContext("2d");
  const surface = paintSurface(kind, FW + PAD * 2, FH + PAD * 2, 3, 1.4);
  const tiles = Array.from({ length: NOISE_TILES }, (_, i) => noiseTile(i + 11));
  const t0 = performance.now();
  let n = 0;
  let at = { x: 0, y: 0 };

  const draw = () => {
    if (!c) return;
    const t = (performance.now() - t0) / 1000;
    n++;
    // a slow drift and a quick hand shake of the whole picture
    at = still
      ? { x: 0, y: 0 }
      : {
          x: Math.sin(t * 0.8) * DRIFT + Math.sin(t * 7.3) * 1.4 + Math.sin(t * 11.1) * 0.8,
          y: Math.cos(t * 0.6) * DRIFT * 0.6 + Math.cos(t * 8.2) * 1.2 + Math.sin(t * 12.7) * 0.7,
        };
    c.drawImage(surface, at.x - PAD, at.y - PAD);
    if (!still) {
      const pat = c.createPattern(tiles[n % NOISE_TILES], "repeat");
      if (pat) {
        c.save();
        c.translate((n * 37) % 256, (n * 53) % 256);
        c.fillStyle = pat;
        c.fillRect(-256, -256, FW + 512, FH + 512);
        c.restore();
      }
    }
  };
  draw();
  const timer = window.setInterval(draw, 1000 / FPS);
  const stream = canvas.captureStream(FPS);
  const fake: FakeCamera = {
    stream,
    offset: () => at,
    stop: () => {
      window.clearInterval(timer);
      stream.getTracks().forEach((tr) => tr.stop());
      if (window.__fakeCamera === fake) delete window.__fakeCamera;
    },
  };
  window.__fakeCamera = fake;
  return fake;
}
