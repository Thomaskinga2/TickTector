// A stand-in camera for testing without a phone: /scan?fakeCamera=1 (or still).
// A 1280x720 canvas stream of skin seen up close, with sensor noise, a slow drift of the whole
// picture and hand shake, so the skin tracker has something to follow.
// Loaded with a dynamic import, so it is not in the normal bundle.

export type FakeCamera = {
  stream: MediaStream;
  offset: () => { x: number; y: number }; // how far the picture has moved, in frame pixels
  stop: () => void;
};

const FW = 1280;
const FH = 720;
const FPS = 30;
const PAD = 60; // the skin is painted this much larger than the frame, so drift never shows an edge
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

// Inner forearm: warm gradient, creases, pores, fine hair and a few freckles
function paintSkin(): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = FW + PAD * 2;
  off.height = FH + PAD * 2;
  const c = off.getContext("2d");
  if (!c) return off;
  const w = off.width;
  const h = off.height;
  const R = rand(3);
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#e7b998");
  g.addColorStop(0.6, "#d79f7b");
  g.addColorStop(1, "#bf8462");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  const ridge = c.createLinearGradient(0, 0, 0, h);
  ridge.addColorStop(0, "rgba(120,60,40,.18)");
  ridge.addColorStop(0.5, "rgba(255,235,215,.14)");
  ridge.addColorStop(1, "rgba(110,55,35,.22)");
  c.fillStyle = ridge;
  c.fillRect(0, 0, w, h);
  c.lineCap = "round";
  for (let i = 0; i < 16; i++) {
    const x = R() * w;
    const y = R() * h;
    c.strokeStyle = "rgba(140,80,55,.22)";
    c.lineWidth = 1.2 + R() * 1.8;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + (R() - 0.5) * 220, y + (R() - 0.5) * 50, x + (R() - 0.5) * 420, y + (R() - 0.5) * 90);
    c.stroke();
  }
  for (let i = 0; i < 3500; i++) {
    c.fillStyle = `rgba(130,70,45,${0.05 + R() * 0.12})`;
    c.beginPath();
    c.arc(R() * w, R() * h, 0.8 + R() * 1.4, 0, Math.PI * 2);
    c.fill();
  }
  for (let i = 0; i < 220; i++) {
    const x = R() * w;
    const y = R() * h;
    const len = 18 + R() * 30;
    const a = 0.9 + (R() - 0.5) * 0.5;
    c.strokeStyle = `rgba(70,40,25,${0.2 + R() * 0.25})`;
    c.lineWidth = 0.8 + R() * 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 3, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    c.stroke();
  }
  for (let i = 0; i < 9; i++) {
    c.fillStyle = `rgba(150,85,55,${0.25 + R() * 0.2})`;
    c.beginPath();
    c.arc(R() * w, R() * h, 2 + R() * 3, 0, Math.PI * 2);
    c.fill();
  }
  return off;
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
  const canvas = document.createElement("canvas");
  canvas.width = FW;
  canvas.height = FH;
  const c = canvas.getContext("2d");
  const skin = paintSkin();
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
    c.drawImage(skin, at.x - PAD, at.y - PAD);
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
