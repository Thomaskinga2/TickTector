// A stand-in camera for testing without a phone: /scan?fakeCamera=1 (or skin, paper, empty, still).
// A 1280x720 canvas stream shows a synthetic bean on skin or paper, with sensor noise, slow drift
// and hand shake, a decoy just outside the viewfinder circle, and a short spell with no bean.
// Loaded with a dynamic import, so it is not in the normal bundle.
import type { BeanPose, Circle } from "./framing";

export type FakeCamera = {
  stream: MediaStream;
  setTarget: (circle: Circle) => void; // the viewfinder circle in frame pixels
  truth: () => BeanPose | null; // where the bean was drawn in the latest frame
  stop: () => void;
};

const FW = 1280;
const FH = 720;
const FPS = 30;
const BEAN_SHARE = 0.24; // bean length as a share of the circle diameter
const BEAN_ASPECT = 1.6;
const NO_BEAN_S = 1.4; // the bean comes into view after this long
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

function paintBackground(kind: "skin" | "paper"): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = FW;
  off.height = FH;
  const c = off.getContext("2d");
  if (!c) return off;
  const R = rand(kind === "skin" ? 3 : 4);
  const g = c.createLinearGradient(0, 0, FW, FH);
  if (kind === "skin") {
    g.addColorStop(0, "#e7b998");
    g.addColorStop(0.6, "#d79f7b");
    g.addColorStop(1, "#bf8462");
  } else {
    g.addColorStop(0, "#f1efe8");
    g.addColorStop(1, "#d9d6cc");
  }
  c.fillStyle = g;
  c.fillRect(0, 0, FW, FH);
  // palm creases or paper fibres, so the detector has texture to ignore
  for (let i = 0; i < (kind === "skin" ? 14 : 40); i++) {
    const x = R() * FW;
    const y = R() * FH;
    c.strokeStyle = kind === "skin" ? "rgba(140,80,55,.28)" : "rgba(120,115,100,.12)";
    c.lineWidth = kind === "skin" ? 1.5 + R() * 2 : 0.6;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + (R() - 0.5) * 200, y + (R() - 0.5) * 60, x + (R() - 0.5) * 400, y + (R() - 0.5) * 120);
    c.stroke();
  }
  for (let i = 0; i < 2500; i++) {
    c.fillStyle = kind === "skin" ? `rgba(130,70,45,${0.05 + R() * 0.1})` : `rgba(90,90,80,${R() * 0.05})`;
    c.fillRect(R() * FW, R() * FH, 1.5, 1.5);
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

function drawBean(c: CanvasRenderingContext2D, b: BeanPose): void {
  c.save();
  c.translate(b.x, b.y);
  c.rotate(b.angle);
  // soft contact shadow, the bean, and the glossy highlight of a black bean
  c.fillStyle = "rgba(60,30,20,.25)";
  c.beginPath();
  c.ellipse(4, 6, b.major / 2 + 3, b.minor / 2 + 3, 0, 0, Math.PI * 2);
  c.fill();
  const g = c.createRadialGradient(-b.major * 0.12, -b.minor * 0.15, 1, 0, 0, b.major / 2);
  g.addColorStop(0, "#4a3236");
  g.addColorStop(1, "#1d1416");
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, 0, b.major / 2, b.minor / 2, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(255,255,255,.55)";
  c.beginPath();
  c.ellipse(-b.major * 0.16, -b.minor * 0.18, b.major * 0.12, b.minor * 0.08, -0.2, 0, Math.PI * 2);
  c.fill();
  // the hilum, a pale line along one side
  c.strokeStyle = "rgba(235,225,215,.7)";
  c.lineWidth = Math.max(1, b.minor * 0.05);
  c.beginPath();
  c.ellipse(0, b.minor * 0.18, b.major * 0.14, b.minor * 0.06, 0, 0, Math.PI);
  c.stroke();
  c.restore();
}

export function startFakeCamera(mode: string): FakeCamera {
  const kind = mode === "paper" ? "paper" : "skin";
  const still = mode === "still";
  const empty = mode === "empty";
  const canvas = document.createElement("canvas");
  canvas.width = FW;
  canvas.height = FH;
  const c = canvas.getContext("2d");
  const bg = paintBackground(kind);
  const tiles = Array.from({ length: NOISE_TILES }, (_, i) => noiseTile(i + 11));
  let target: Circle = { x: FW / 2, y: FH / 2, r: 200 };
  let bean: BeanPose | null = null;
  const t0 = performance.now();
  let n = 0;

  const draw = () => {
    if (!c) return;
    const t = (performance.now() - t0) / 1000;
    n++;
    // hand shake moves the whole picture a little; drift moves the bean slowly
    const shakeX = still ? 0 : Math.sin(t * 7.3) * 1.4 + Math.sin(t * 11.1) * 0.8;
    const shakeY = still ? 0 : Math.cos(t * 8.2) * 1.2 + Math.sin(t * 12.7) * 0.7;
    c.drawImage(bg, shakeX - 4, shakeY - 4, FW + 8, FH + 8);
    const d = target.r * 2;
    // decoy: a second bean just outside the circle, at its upper right; it must never lock
    const decoyLen = d * BEAN_SHARE * 0.9;
    const decoyAt = target.r + decoyLen * 0.75;
    drawBean(c, {
      x: target.x + decoyAt * 0.8 + shakeX,
      y: target.y - decoyAt * 0.6 + shakeY,
      major: decoyLen,
      minor: decoyLen / BEAN_ASPECT,
      angle: -0.4,
    });
    const show = !empty && (still || t >= NO_BEAN_S);
    bean = show
      ? {
          x: target.x + d * 0.06 + (still ? 0 : Math.sin(t * 0.9) * d * 0.035) + shakeX,
          y: target.y - d * 0.04 + (still ? 0 : Math.cos(t * 0.7) * d * 0.03) + shakeY,
          major: d * BEAN_SHARE,
          minor: (d * BEAN_SHARE) / BEAN_ASPECT,
          angle: 0.55 + (still ? 0 : Math.sin(t * 0.5) * 0.08),
        }
      : null;
    if (bean) drawBean(c, bean);
    if (!still) {
      const tile = tiles[n % NOISE_TILES];
      const pat = c.createPattern(tile, "repeat");
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
    setTarget: (circle) => {
      target = circle;
    },
    truth: () => bean,
    stop: () => {
      window.clearInterval(timer);
      stream.getTracks().forEach((tr) => tr.stop());
      if (window.__fakeCamera === fake) delete window.__fakeCamera;
    },
  };
  window.__fakeCamera = fake;
  return fake;
}
