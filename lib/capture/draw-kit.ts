// Small drawing pieces shared by the capture scene and the life-cycle diagram.
// Ported from reference/capture-preview.html. A canvas can't read CSS tokens, so the colours are written out:
// the one deliberate exception to the theme-token rule. Paper, ink and green copy the app's tokens.
import { lerp } from "./timeline";

export type Ctx = CanvasRenderingContext2D;

// CSS font-family lists for the three canvas faces (lib/capture/fonts.ts)
export type CanvasFonts = { display: string; body: string; mono: string };

export const rng = (start: number) => {
  let seed = start;
  return (): number => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const hex = (h: string): number[] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, p: number): string => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(",")})`;
};
export const mix3 = (a: string, b: string, c: string, p: number, q: number): string => {
  const A = hex(a);
  const B = hex(b);
  const C = hex(c);
  return `rgb(${A.map((v, i) => Math.round(lerp(lerp(v, B[i], p), C[i], q))).join(",")})`;
};

export function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

export function brackets(c: Ctx, cx: number, cy: number, half: number, alpha: number): void {
  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = "#ffffff";
  c.lineWidth = 3;
  c.lineCap = "round";
  const k = half * 0.35;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = cx + sx * half;
    const y = cy + sy * half;
    c.beginPath();
    c.moveTo(x - sx * k, y);
    c.lineTo(x, y);
    c.lineTo(x, y - sy * k);
    c.stroke();
  }
  c.restore();
}

export type TickLook = { glow?: number; phase?: number; fed?: number; stretch?: number; legs?: number };

// fed: 0 = flat, 1 = fully engorged. stretch: lengthwise strain while being pulled out
// legs: pairs per side (larvae have three, nymphs and adults four)
export function drawTick(c: Ctx, x: number, y: number, s: number, look: TickLook = {}): void {
  const { glow = 0, phase = 0, fed = 0.5, stretch = 0, legs = 4 } = look;
  c.save();
  c.translate(x, y);
  c.scale(s, s * (1 + stretch));
  if (glow > 0) {
    c.shadowColor = `rgba(120,255,170,${glow})`;
    c.shadowBlur = 24 * glow;
  }
  c.strokeStyle = mix("#1a1310", "#c9ffd9", glow);
  c.lineWidth = 2.6;
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const side of [-1, 1]) {
    for (let i = 0; i < legs; i++) {
      const w = Math.sin(phase * 9 + i * 1.7 + side) * 1.6;
      const by = -9 + i * 5.5;
      c.beginPath();
      c.moveTo(side * 8, by);
      c.lineTo(side * (19 + (i % 2) * 2), by - 7 + i * 3 + w);
      c.lineTo(side * (27 - i), by - 2 + i * 5.5 + w * 0.6);
      c.stroke();
    }
  }
  // a feeding deer tick's abdomen swells and turns from red-brown to slate grey
  c.fillStyle = mix3("#7a2e14", "#8a7570", "#e9fff0", fed, glow);
  c.beginPath();
  c.ellipse(0, 7 + fed * 3, 14.5 + fed * 4, 18.5 + fed * 6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mix("#a5461f", "#ffffff", glow);
  c.globalAlpha = 0.45 * (1 - fed * 0.5);
  c.beginPath();
  c.ellipse(-4, 9, 5, 9, -0.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffffff";
  c.globalAlpha = 0.28 * fed;
  c.beginPath();
  c.ellipse(-6, 4 + fed * 3, 4, 8, -0.3, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = mix("#18110d", "#bfffd2", glow);
  c.beginPath();
  c.ellipse(0, -7, 10, 9.5, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(-4, -14);
  c.lineTo(0, -24);
  c.lineTo(4, -14);
  c.fill();
  c.restore();
}

function tubePath(c: Ctx): void {
  c.beginPath();
  c.moveTo(-15, -36);
  c.lineTo(-15, 25);
  c.arc(0, 25, 15, Math.PI, 0, true);
  c.lineTo(15, -36);
  c.closePath();
}

export type VialPose = {
  x: number;
  y: number;
  s: number;
  rot: number;
  cork: number;
  glow: number;
  filled: boolean;
  t: number;
  pivotRot?: number;
  scan?: number;
  tickGlow?: number;
  trail?: boolean;
};

export function drawVial(c: Ctx, v: VialPose, fonts: CanvasFonts): void {
  c.save();
  c.translate(v.x, v.y);
  if (v.pivotRot) {
    c.translate(0, 40 * v.s);
    c.rotate(v.pivotRot);
    c.translate(0, -40 * v.s);
  }
  c.rotate(v.rot || 0);
  c.scale(v.s, v.s);
  if (v.glow > 0) {
    c.shadowColor = `rgba(110,240,160,${v.glow})`;
    c.shadowBlur = 28 * v.glow;
  }
  tubePath(c);
  c.fillStyle = "rgba(225,246,255,.42)";
  c.fill();
  c.shadowBlur = 0;
  c.save();
  tubePath(c);
  c.clip();
  c.fillStyle = "rgba(170,215,235,.45)";
  c.fillRect(-16, 2, 32, 40);
  if (v.filled) drawTick(c, 0, 14, 0.3, { glow: v.tickGlow || 0, phase: v.t });
  if (v.scan != null) {
    const sy = lerp(-36, 40, v.scan);
    const gr = c.createLinearGradient(0, sy - 10, 0, sy + 2);
    gr.addColorStop(0, "rgba(90,255,150,0)");
    gr.addColorStop(1, "rgba(90,255,150,.85)");
    c.fillStyle = gr;
    c.fillRect(-16, sy - 10, 32, 12);
  }
  c.restore();
  c.fillStyle = "#f3ecdc";
  c.fillRect(-15, -26, 30, 14);
  c.fillStyle = "#2f5a3c";
  c.font = `600 8px ${fonts.mono}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("TC-001", 0, -19);
  tubePath(c);
  c.lineWidth = 2.5;
  c.strokeStyle = "rgba(255,255,255,.95)";
  c.stroke();
  c.lineWidth = 1.2;
  c.strokeStyle = "rgba(20,45,30,.55)";
  c.stroke();
  c.strokeStyle = "rgba(255,255,255,.8)";
  c.lineWidth = 3;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-9, -8);
  c.lineTo(-9, 26);
  c.stroke();
  c.fillStyle = "rgba(255,255,255,.9)";
  roundRect(c, -18, -40, 36, 6, 3);
  c.fill();
  c.strokeStyle = "rgba(20,45,30,.45)";
  c.lineWidth = 1;
  c.stroke();
  c.save();
  c.translate(0, -40 - (v.cork || 0) * 30);
  c.rotate(-(v.cork || 0) * 0.55);
  const ck = c.createLinearGradient(-12, 0, 12, 0);
  ck.addColorStop(0, "#b98a52");
  ck.addColorStop(0.5, "#dcb27a");
  ck.addColorStop(1, "#a87a45");
  c.fillStyle = ck;
  roundRect(c, -12, -15, 24, 17, 4);
  c.fill();
  c.fillStyle = "rgba(110,70,30,.5)";
  for (const [a, b] of [[-6, -10], [3, -6], [-2, -2], [6, -11]]) {
    c.beginPath();
    c.arc(a, b, 1.1, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  c.restore();
}

export function star(c: Ctx, x: number, y: number, r: number, rot: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 ? r * 0.38 : r;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  c.restore();
}

export function stampText(
  c: Ctx,
  fonts: CanvasFonts,
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  stroke: string,
  scale = 1,
  alpha = 1,
): void {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.scale(scale, scale);
  c.font = `800 ${size}px ${fonts.display}`;
  // SF Pro Rounded Heavy sets tight: a little tracking keeps the thick outline from fusing the letters
  if ("letterSpacing" in c) c.letterSpacing = `${(size * 0.05).toFixed(1)}px`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.lineJoin = "round";
  c.lineWidth = size * 0.18;
  c.strokeStyle = stroke;
  c.strokeText(text, 0, 0);
  c.fillStyle = fill;
  c.fillText(text, 0, 0);
  c.restore();
}

export function pill(c: Ctx, fonts: CanvasFonts, x: number, y: number, text: string, dot?: string): number {
  c.font = `600 12px ${fonts.body}`;
  const w = c.measureText(text).width + (dot ? 30 : 20);
  c.fillStyle = "rgba(255,255,255,.88)";
  roundRect(c, x, y, w, 26, 13);
  c.fill();
  if (dot) {
    c.fillStyle = dot;
    c.beginPath();
    c.arc(x + 13, y + 13, 4, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#221c14";
  c.textBaseline = "middle";
  c.textAlign = "left";
  c.fillText(text, x + (dot ? 22 : 10), y + 13.5);
  return w;
}

export type Sprite = { img: HTMLCanvasElement; w: number; h: number };

// k: drawn size relative to the sprite's own units, baked in at full resolution
export function sprite(w: number, h: number, draw: (c: Ctx) => void, dpr: number, k = 1): Sprite {
  const off = document.createElement("canvas");
  off.width = Math.ceil(w * k * dpr);
  off.height = Math.ceil(h * k * dpr);
  const c = off.getContext("2d");
  if (c) {
    c.scale(dpr * k, dpr * k);
    draw(c);
  }
  return { img: off, w: w * k, h: h * k };
}

export const blit = (c: Ctx, s: Sprite, x: number, y: number, k = 1): void =>
  c.drawImage(s.img, x - (s.w * k) / 2, y - (s.h * k) / 2, s.w * k, s.h * k);
