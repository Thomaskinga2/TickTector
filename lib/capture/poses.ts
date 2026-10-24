// Where the vial and the tick are at scene time t. Pure functions of t (and the timeline).
import type { VialPose } from "./draw-kit";
import {
  DROP,
  eBounce,
  eIn,
  eInOut,
  eOut,
  GROUND_Y,
  HIT,
  HOVER_Y,
  IN,
  lerp,
  POP,
  REST,
  seg,
  TICK,
  TUG,
  VIAL_FAR,
  WOBBLE,
  type Timeline,
} from "./timeline";

export function vialPose(t: number, L: Timeline): VialPose {
  const v: VialPose = { x: REST.x, y: REST.y, s: 1, rot: 0, cork: 0, glow: 0, filled: t >= IN, t };
  if (t < 0.9) {
    v.glow = 0.35 + 0.25 * Math.sin(t * 9);
    if (t > 0.6) v.y += Math.sin(seg(t, 0.6, 0.9) * Math.PI) * 16;
    return v;
  }
  if (t < HIT) {
    const p = seg(t, 0.9, HIT);
    const e = 1 - Math.pow(1 - p, 1.7);
    const p0 = REST;
    const p1 = { x: TICK.x, y: TICK.y - 15 };
    const cp = { x: p0.x + 50, y: 110 };
    v.x = (1 - e) * (1 - e) * p0.x + 2 * (1 - e) * e * cp.x + e * e * p1.x;
    v.y = (1 - e) * (1 - e) * p0.y + 2 * (1 - e) * e * cp.y + e * e * p1.y;
    v.s = lerp(1, VIAL_FAR, e);
    v.rot = e * Math.PI * 6;
    v.trail = true;
    return v;
  }
  v.s = VIAL_FAR;
  if (t < DROP) {
    const p = eOut(seg(t, HIT, 1.8));
    v.x = TICK.x;
    v.y = lerp(TICK.y - 15, HOVER_Y, p) + Math.sin(t * 6) * 2 * p;
    v.cork = eOut(seg(t, 1.62, 1.8)) * (1 - eIn(seg(t, 2.25, DROP)));
    v.glow = 0.5 * seg(t, 1.6, 1.8) * (1 - seg(t, 2.3, DROP));
    return v;
  }
  v.x = TICK.x;
  if (t < L.wobStart) {
    v.y = lerp(HOVER_Y, GROUND_Y, eBounce(seg(t, DROP, L.wobStart)));
    return v;
  }
  v.y = GROUND_Y;
  if (t < L.click) {
    const k = Math.floor((t - L.wobStart) / WOBBLE);
    const p = seg(t - L.wobStart - k * WOBBLE, 0, 0.45);
    v.pivotRot = Math.sin(p * Math.PI * 2) * 0.38 * Math.sin(p * Math.PI);
    if (p < 1) v.scan = p;
    v.tickGlow = 0.6 * Math.sin(p * Math.PI);
    return v;
  }
  v.glow = 0.9 * (1 - seg(t, L.click, L.click + 1.2)) + 0.25;
  return v;
}

export type TickPose = {
  x: number;
  y: number;
  s: number; // multiplies the tick's own scale
  rot: number;
  glow: number;
  stretch: number;
  phase: number;
  lift: number; // 0 attached .. 1 off the skin (the shadow fades)
};
export type TickPlacement = { scale: number; angle: number };

const BITE_REACH = 22; // centre to mouthparts, tick units
const STRAIGHTEN_AT = 1.5; // the beam turns the tick head-up before the pull

// Where the mouthparts are in the skin: fixed for the whole catch
export function biteAt(look: TickPlacement): { x: number; y: number } {
  const d = BITE_REACH * look.scale;
  return { x: TICK.x + d * Math.sin(look.angle), y: TICK.y - d * Math.cos(look.angle) };
}

// The tick hangs from its bite: it turns head-up about it, strains, pops free, flies to the vial
export function tickPose(t: number, look: TickPlacement): TickPose | null {
  if (t >= IN) return null;
  const sc = look.scale;
  const bite = biteAt(look);
  const rot = look.angle * (1 - eInOut(seg(t, STRAIGHTEN_AT, TUG)));
  let x = bite.x - BITE_REACH * sc * Math.sin(rot);
  let y = bite.y + BITE_REACH * sc * Math.cos(rot);
  let s = 1;
  let glow = 0;
  let stretch = 0;
  let lift = 0;
  let phase = t * 0.5;
  if (t > 1.6) glow = 0.45 * eOut(seg(t, 1.6, 1.78));
  if (t >= TUG && t < POP) {
    const p = seg(t, TUG, POP);
    y -= (8 * eOut(p) - Math.sin(t * 70) * 1.5) * sc;
    stretch = 0.16 * p;
    lift = 0.35 * p;
    phase = t * 3;
  }
  if (t >= POP) {
    const p = eIn(seg(t, POP, IN));
    glow = lerp(0.45, 1, seg(t, POP, POP + 0.08));
    s = lerp(1, 0.08, p);
    x = lerp(bite.x, TICK.x, p);
    y = lerp(bite.y + (BITE_REACH - 8) * sc, HOVER_Y - 26, p);
    lift = 1;
    phase = t * 3;
  }
  return { x, y, s, rot, glow, stretch, phase, lift };
}
