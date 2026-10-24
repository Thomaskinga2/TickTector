// Plain surfaces a removed tick is put on for its photo: a sheet of paper, a wooden table, a stone
// counter. Painted for the fake camera and for "Use the sample". Fixed colours (see draw-kit.ts).
import { rng, type Ctx } from "./draw-kit";

export const SURFACES = ["paper", "wood", "stone"] as const;
export type Surface = (typeof SURFACES)[number];

function paper(c: Ctx, w: number, h: number, R: () => number, k: number): void {
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#f4f1ea");
  g.addColorStop(1, "#dcd6ca");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  // fibres and a few specks, so the surface tracker has something to follow
  c.lineCap = "round";
  for (let i = 0; i < 900; i++) {
    const x = R() * w;
    const y = R() * h;
    const len = (6 + R() * 18) * k;
    const a = R() * Math.PI;
    c.strokeStyle = `rgba(${R() < 0.5 ? "120,112,96" : "255,255,255"},${0.1 + R() * 0.18})`;
    c.lineWidth = (0.6 + R() * 0.8) * k;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 2 * k, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    c.stroke();
  }
  for (let i = 0; i < 160; i++) {
    c.fillStyle = `rgba(90,80,64,${0.12 + R() * 0.2})`;
    c.beginPath();
    c.arc(R() * w, R() * h, (0.6 + R() * 1.2) * k, 0, Math.PI * 2);
    c.fill();
  }
}

function wood(c: Ctx, w: number, h: number, R: () => number, k: number): void {
  c.fillStyle = "#b07e55";
  c.fillRect(0, 0, w, h);
  // long wavy grain lines across the board
  for (let i = 0; i < 140; i++) {
    const y0 = R() * h;
    const amp = (4 + R() * 14) * k;
    const freq = (0.002 + R() * 0.004) / k;
    const ph = R() * 6;
    c.strokeStyle = R() < 0.6 ? `rgba(110,64,32,${0.12 + R() * 0.25})` : `rgba(230,190,140,${0.08 + R() * 0.15})`;
    c.lineWidth = (0.8 + R() * 2.6) * k;
    c.beginPath();
    for (let x = 0; x <= w; x += 12 * k) {
      const y = y0 + Math.sin(x * freq + ph) * amp;
      if (x === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  // a knot
  const kx = R() * w;
  const ky = R() * h;
  for (let r = 3; r < 40; r += 4) {
    c.strokeStyle = `rgba(90,50,25,${0.35 - r / 140})`;
    c.lineWidth = 1.6 * k;
    c.beginPath();
    c.ellipse(kx, ky, r * 2.4 * k, r * k, 0, 0, Math.PI * 2);
    c.stroke();
  }
}

function stone(c: Ctx, w: number, h: number, R: () => number, k: number): void {
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#c4c0b9");
  g.addColorStop(1, "#a9a49c");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) {
    const dark = R() < 0.55;
    c.fillStyle = dark ? `rgba(60,58,55,${0.15 + R() * 0.35})` : `rgba(250,248,244,${0.2 + R() * 0.4})`;
    c.beginPath();
    c.arc(R() * w, R() * h, (0.5 + R() * 2.2) * k, 0, Math.PI * 2);
    c.fill();
  }
}

// k: pixels per CSS pixel of detail, so a phone-sized canvas and a camera frame look alike
export function paintSurface(kind: Surface, w: number, h: number, seed: number, k = 1): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(w));
  off.height = Math.max(1, Math.round(h));
  const c = off.getContext("2d");
  if (!c) return off;
  const R = rng(seed);
  if (kind === "paper") paper(c, off.width, off.height, R, k);
  else if (kind === "wood") wood(c, off.width, off.height, R, k);
  else stone(c, off.width, off.height, R, k);
  return off;
}
