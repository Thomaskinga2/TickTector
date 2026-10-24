// Turns a stream of detections into a lock: the same candidate must hold steady for LOCK_HOLD_S.
// Pure, like the detector. Positions are in the detector's crop pixels.
import type { BeanCandidate } from "./bean-detector";

export const TRACKER = {
  LOCK_HOLD_S: 0.5, // steady this long to lock
  MAX_JUMP_SHARE: 0.1, // a move larger than this share of the circle diameter is a new candidate
  MAX_SIZE_CHANGE: 0.35, // same for a change in length
  MISS_GRACE_S: 0.25, // one or two missed checks do not reset the hold
  SMOOTHING: 0.45, // weight of the newest detection in the smoothed pose
} as const;

export type TrackedPose = { x: number; y: number; major: number; minor: number; angle: number };
export type TrackState = { pose: TrackedPose | null; since: number; seen: number };
export type TrackStep = { state: TrackState; progress: number; locked: boolean };

export const NO_TRACK: TrackState = { pose: null, since: 0, seen: 0 };

// Angles are axial (a bean has no head): blend them as doubled-angle vectors
function blendAngle(a: number, b: number, w: number): number {
  const x = (1 - w) * Math.cos(2 * a) + w * Math.cos(2 * b);
  const y = (1 - w) * Math.sin(2 * a) + w * Math.sin(2 * b);
  return Math.atan2(y, x) / 2;
}

export function track(prev: TrackState, best: BeanCandidate | null, now: number, circleR: number): TrackStep {
  if (!best) {
    if (prev.pose && now - prev.seen <= TRACKER.MISS_GRACE_S) {
      return { state: prev, progress: Math.min(1, (prev.seen - prev.since) / TRACKER.LOCK_HOLD_S), locked: false };
    }
    return { state: NO_TRACK, progress: 0, locked: false };
  }
  const p = prev.pose;
  const same =
    p !== null &&
    now - prev.seen <= TRACKER.MISS_GRACE_S &&
    Math.hypot(best.x - p.x, best.y - p.y) <= TRACKER.MAX_JUMP_SHARE * 2 * circleR &&
    Math.abs(best.major - p.major) <= TRACKER.MAX_SIZE_CHANGE * p.major;
  if (!same || !p) {
    const pose = { x: best.x, y: best.y, major: best.major, minor: best.minor, angle: best.angle };
    return { state: { pose, since: now, seen: now }, progress: 0, locked: false };
  }
  const w = TRACKER.SMOOTHING;
  const pose: TrackedPose = {
    x: p.x + (best.x - p.x) * w,
    y: p.y + (best.y - p.y) * w,
    major: p.major + (best.major - p.major) * w,
    minor: p.minor + (best.minor - p.minor) * w,
    angle: blendAngle(p.angle, best.angle, w),
  };
  const progress = Math.min(1, (now - prev.since) / TRACKER.LOCK_HOLD_S);
  return { state: { pose, since: prev.since, seen: now }, progress, locked: progress >= 1 };
}
