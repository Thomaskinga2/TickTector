// The Tickdex capture animation's one clock. Ported from reference/capture-preview.html.
// Scene time t starts at the shutter flash; app time T = t + OPEN_LEN, because the viewfinder
// circle opens out to full screen for OPEN_LEN seconds before beat 1.

export const W = 360;
export const H = 700;
export const TICK = { x: 180, y: 330 };
export const REST = { x: 180, y: 612 };
export const HOVER_Y = 250;
export const GROUND_Y = 385;
export const VIAL_FAR = 0.55;

// The circle-to-full-screen opening, played before beat 1
export const OPEN_LEN = 0.45;

export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
export const seg = (t: number, a: number, b: number): number => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;
export const eOut = (p: number): number => 1 - Math.pow(1 - p, 3);
export const eIn = (p: number): number => p * p * p;
export const eInOut = (p: number): number => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const eBack = (p: number): number => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};
export const eBounce = (p: number): number => {
  const n = 7.5625;
  const d = 2.75;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) return n * (p - 1.5 / d) * (p - 1.5 / d) + 0.75;
  if (p < 2.5 / d) return n * (p - 2.25 / d) * (p - 2.25 / d) + 0.9375;
  return n * (p - 2.625 / d) * (p - 2.625 / d) + 0.984375;
};

export const WOBBLE = 0.65;
export const HIT = 1.55;
export const DIAGRAM_LEN = 3.2;
// The beam grips the tick (TUG), lifts it off the surface (POP), then it flies into the vial (IN)
export const TUG = 1.78;
export const POP = 2.02;
export const IN = 2.22;
// The vial drops here; the full or quick catch must be chosen by then
export const DROP = 2.45;

export type Timeline = {
  quick: boolean;
  wobbles: number;
  wobStart: number;
  click: number;
  card: number;
  dScale: number;
  end: number;
};

export function makeTimeline(quick: boolean): Timeline {
  const wobbles = quick ? 0 : 3;
  const wobStart = 2.8;
  const click = wobStart + wobbles * WOBBLE + (quick ? 0.05 : 0);
  const card = click + 0.8;
  // the life-cycle beat runs a little faster for repeat catches, but never skips
  const dScale = quick ? 0.76 : 1;
  return { quick, wobbles, wobStart, click, card, dScale, end: card + DIAGRAM_LEN * dScale };
}

export const ringAt = (x: number): number => 18 + 40 * (1 - ((x / 1.6) % 1));
export const grade = (r: number): string => (r <= 28 ? "Excellent!" : r <= 42 ? "Great!" : "Nice!");

// Next app time. Without a result the clock holds on the wobbles: it loops the last one.
export function advanceClock(T: number, dt: number, L: Timeline, hasResult: boolean): number {
  let next = T + dt;
  const click = OPEN_LEN + L.click;
  if (!hasResult && L.wobbles > 0 && next >= click) next -= WOBBLE * Math.ceil((next - click + 1e-6) / WOBBLE);
  return Math.min(next, OPEN_LEN + L.end);
}
