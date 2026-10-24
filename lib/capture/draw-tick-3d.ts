// A shaded, shadowed tick for the photo: light from the top left, a soft cast shadow on the skin,
// jointed legs with a highlight, a domed body and a glossy shield. Used both on the live camera
// and in the capture animation, so the hand-over between them is seamless.
// Fixed game colours on purpose (see draw-kit.ts).
import type { TickStage } from "@/lib/tickdex";
import type { Ctx } from "./draw-kit";
import { lerp } from "./timeline";
import { FED_LEVEL, STAGE_SCALE, type SimTick, type SpeciesId } from "./tick-sim";

type Rgb = [number, number, number];
type Palette = { leg: Rgb; shield: Rgb; body: Rgb; fed: Rgb; mark: "none" | "ornate" | "dot" };

// Adult females; younger stages are paler (see stagePalette)
const PALETTES: Record<SpeciesId, Palette> = {
  "deer-tick": { leg: [36, 26, 22], shield: [27, 18, 16], body: [138, 58, 28], fed: [138, 128, 122], mark: "none" },
  "dog-tick": { leg: [90, 58, 36], shield: [107, 68, 40], body: [110, 69, 39], fed: [138, 144, 150], mark: "ornate" },
  "lone-star-tick": { leg: [91, 47, 31], shield: [106, 52, 32], body: [122, 58, 32], fed: [142, 138, 134], mark: "dot" },
};
const LARVA_TONE: Rgb = [214, 182, 140];
const GLOW: Rgb = [200, 255, 215];

export type Tick3dLook = {
  species: SpeciesId;
  stage: TickStage;
  fed: number; // 0 flat .. 1 engorged
  scale: number;
  angle: number;
  legs: number;
};
export type Tick3dPose = { glow?: number; stretch?: number; phase?: number; lift?: number };

const mixRgb = (a: Rgb, b: Rgb, p: number): Rgb => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
const css = (c: Rgb, alpha = 1): string => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`;
const shade = (c: Rgb, k: number): Rgb => (k >= 0 ? mixRgb(c, [255, 255, 255], k) : mixRgb(c, [0, 0, 0], -k));

function stagePalette(species: SpeciesId, stage: TickStage, glow: number): Palette {
  const p = PALETTES[species];
  const pale = stage === "larva" ? 0.55 : stage === "nymph" ? 0.18 : 0;
  const f = (c: Rgb) => mixRgb(mixRgb(c, LARVA_TONE, pale), GLOW, glow);
  return { leg: f(p.leg), shield: f(p.shield), body: f(p.body), fed: f(p.fed), mark: stage === "adult" ? p.mark : "none" };
}

// Legs fan from the body's sides: front pairs reach forward, back pairs trail. Angles from the
// side axis, negative = towards the head. Each leg arches out, bends at the knee and tapers.
const LEG_ANGLES: Record<number, number[]> = { 3: [-0.8, 0, 0.75], 4: [-0.95, -0.35, 0.3, 0.8] };
const LEG_WIDTH = [3.4, 2.4, 1.4];

function legPoints(side: number, i: number, legs: number, w: number): [number, number][] {
  const a = LEG_ANGLES[legs][i] + w * 0.04;
  const bend = 0.45 + i * 0.08; // the lower leg turns towards the rear
  const bx = side * 7.5;
  const by = -8 + i * (legs === 3 ? 6 : 4.6);
  const kx = bx + side * Math.cos(a) * 9.5;
  const ky = by + Math.sin(a) * 9.5 - 2.2;
  const fx = kx + side * Math.cos(a + bend) * 8;
  const fy = ky + Math.sin(a + bend) * 8 + 1.5;
  const tx = fx + side * Math.cos(a + bend + 0.5) * 3.2;
  const ty = fy + Math.sin(a + bend + 0.5) * 3.2;
  return [[bx, by], [kx, ky], [fx, fy], [tx, ty]];
}

function drawLegs(c: Ctx, legs: number, phase: number, col: Rgb, shadow: boolean): void {
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const side of [-1, 1]) {
    for (let i = 0; i < legs; i++) {
      const pts = legPoints(side, i, legs, Math.sin(phase * 9 + i * 1.7 + side) * 1.6);
      for (let k = 0; k < pts.length - 1; k++) {
        c.lineWidth = LEG_WIDTH[k] + (shadow ? 0.4 : 0);
        c.strokeStyle = shadow ? "rgba(45,22,12,.22)" : css(shade(col, -0.1 * k));
        c.beginPath();
        c.moveTo(pts[k][0], pts[k][1]);
        c.lineTo(pts[k + 1][0], pts[k + 1][1]);
        c.stroke();
        if (!shadow && k < 2) {
          // a thin lit edge on the upper side of the thick segments
          c.lineWidth = 0.8;
          c.strokeStyle = css(shade(col, 0.5), 0.75);
          c.beginPath();
          c.moveTo(pts[k][0] - 0.4, pts[k][1] - 0.7);
          c.lineTo(pts[k + 1][0] - 0.4, pts[k + 1][1] - 0.7);
          c.stroke();
        }
      }
    }
  }
}

// The soft shadow the tick casts on the skin; grows and fades as it is lifted off
export function drawTick3dShadow(c: Ctx, x: number, y: number, look: Tick3dLook, pose: Tick3dPose = {}): void {
  const lift = pose.lift ?? 0;
  const fed = look.fed;
  c.save();
  c.translate(x + (2.5 + lift * 12) * look.scale, y + (4 + lift * 16) * look.scale);
  c.rotate(look.angle);
  c.scale(look.scale, look.scale);
  const fade = 1 - lift * 0.7;
  for (const [grow, a] of [[1.25, 0.08], [1.1, 0.1], [0.95, 0.14]]) {
    c.fillStyle = `rgba(45,22,12,${a * fade})`;
    c.beginPath();
    c.ellipse(0, 4 + fed * 3, (15 + fed * 4) * grow, (24 + fed * 6) * grow, 0, 0, Math.PI * 2);
    c.fill();
  }
  if (lift < 0.5) drawLegs(c, look.legs, pose.phase ?? 0, [0, 0, 0], true);
  c.restore();
}

export function drawTick3d(c: Ctx, x: number, y: number, look: Tick3dLook, pose: Tick3dPose = {}): void {
  const { glow = 0, stretch = 0, phase = 0 } = pose;
  const fed = look.fed;
  const pal = stagePalette(look.species, look.stage, glow);
  c.save();
  c.translate(x, y);
  c.rotate(look.angle);
  c.scale(look.scale, look.scale * (1 + stretch));
  if (glow > 0) {
    c.shadowColor = `rgba(120,255,170,${glow})`;
    c.shadowBlur = 24 * glow * look.scale;
  }
  drawLegs(c, look.legs, phase, pal.leg, false);
  c.shadowBlur = 0;

  // body: a dome lit from the top left, darker at the rim; engorged bodies are taut and glossy
  const body = mixRgb(pal.body, pal.fed, Math.pow(fed, 1.6)); // stays red-brown until well fed
  const by = 7 + fed * 3;
  const rx = 14.5 + fed * 4;
  const ry = 18.5 + fed * 6;
  const g = c.createRadialGradient(-rx * 0.35, by - ry * 0.35, 1, 0, by, ry * 1.05);
  g.addColorStop(0, css(shade(body, 0.32 + fed * 0.15)));
  g.addColorStop(0.55, css(body));
  g.addColorStop(1, css(shade(body, -0.45)));
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, by, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  // marginal groove of an unfed tick, and the sheen of a fed one
  c.strokeStyle = css(shade(body, -0.35), 0.6 * (1 - fed));
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(0, by + 1, rx * 0.78, ry * 0.8, 0, 0.2, Math.PI - 0.2);
  c.stroke();
  c.fillStyle = `rgba(255,255,255,${0.12 + 0.3 * fed})`;
  c.beginPath();
  c.ellipse(-rx * 0.38, by - ry * 0.3, rx * 0.22, ry * 0.32, -0.35, 0, Math.PI * 2);
  c.fill();

  // shield (scutum) and its marks
  const sg = c.createRadialGradient(-3, -11, 0.5, 0, -7, 11);
  sg.addColorStop(0, css(shade(pal.shield, 0.35)));
  sg.addColorStop(1, css(shade(pal.shield, -0.3)));
  c.fillStyle = sg;
  c.beginPath();
  c.ellipse(0, -7, 10, 9.5, 0, 0, Math.PI * 2);
  c.fill();
  if (pal.mark === "ornate") {
    // the dog tick's pale, marbled shield
    c.strokeStyle = "rgba(232,226,210,.8)";
    c.lineCap = "round";
    c.lineWidth = 1.7;
    for (const [x0, y0, cx, cy, x1, y1] of [[-7, -12, -8, -7, -5, -2], [7, -12, 8, -7, 5, -2], [-3, -14, 0, -11, 3, -14], [-2, -7, 0, -5, 2, -7]]) {
      c.beginPath();
      c.moveTo(x0, y0);
      c.quadraticCurveTo(cx, cy, x1, y1);
      c.stroke();
    }
  } else if (pal.mark === "dot") {
    c.fillStyle = "rgba(245,240,226,.95)";
    c.beginPath();
    c.ellipse(0, -4.5, 2.6, 3, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "rgba(255,255,255,.35)";
  c.beginPath();
  c.ellipse(-3.5, -11, 3, 1.6, -0.5, 0, Math.PI * 2);
  c.fill();

  // mouthparts: the hypostome between two palps (the lone star tick's are longer)
  const tip = look.species === "lone-star-tick" ? -27 : -24;
  c.fillStyle = css(shade(pal.shield, -0.15));
  c.beginPath();
  c.moveTo(-4, -14);
  c.lineTo(0, tip);
  c.lineTo(4, -14);
  c.fill();
  c.fillStyle = css(shade(pal.leg, 0.1));
  for (const side of [-1, 1]) {
    c.beginPath();
    c.ellipse(side * 3.2, -17.5, 1.6, 3.6, side * 0.15, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// Redness of the skin around the bite, scaled with the tick
export function drawBiteHalo(c: Ctx, x: number, y: number, scale: number, alpha = 1): void {
  const r = 30 * Math.max(0.6, scale);
  const halo = c.createRadialGradient(x, y, 2, x, y, r);
  halo.addColorStop(0, `rgba(205,70,60,${0.55 * alpha})`);
  halo.addColorStop(1, "rgba(205,70,60,0)");
  c.fillStyle = halo;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

// Where the mouthparts enter the skin, from the tick's centre (tick units times unit)
const BITE_REACH = 22;
export function biteOffset(look: Tick3dLook, unit: number): { x: number; y: number } {
  const d = BITE_REACH * look.scale * unit;
  return { x: d * Math.sin(look.angle), y: -d * Math.cos(look.angle) };
}

export function lookFor(sim: SimTick): Tick3dLook {
  return {
    species: sim.speciesId,
    stage: sim.stage,
    fed: FED_LEVEL[sim.engorgement],
    scale: STAGE_SCALE[sim.stage],
    angle: sim.angle,
    legs: sim.stage === "larva" ? 3 : 4,
  };
}

// The attached tick as it sits on the skin: redness, cast shadow, tick. unit: pixels per tick unit.
export function drawTickOnSkin(c: Ctx, x: number, y: number, look: Tick3dLook, unit: number, alpha = 1): void {
  const scaled = { ...look, scale: look.scale * unit };
  const bite = biteOffset(look, unit);
  c.save();
  c.globalAlpha = alpha;
  drawBiteHalo(c, x + bite.x, y + bite.y, scaled.scale);
  drawTick3dShadow(c, x, y, scaled);
  drawTick3d(c, x, y, scaled);
  c.restore();
}
