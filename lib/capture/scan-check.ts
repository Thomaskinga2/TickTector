// One detector check on the live picture: crop the viewfinder circle out of the full-resolution
// frame, find the bean, track it, and map the result back to frame pixels.
import { detectBean, type BeanCandidate } from "./bean-detector";
import { track, type TrackState, type TrackStep } from "./bean-tracker";
import { circleInSource, type BeanPose, type Circle, type Mapping, type Point } from "./framing";
import { cropCircle, type FrameSource } from "./photo";

export const DETECT_SIZE = 160; // the circle crop is downscaled to this many pixels across
export const CHECK_MS = 80; // about 12 checks a second
// "Tap the bean": the tap takes a candidate this close (share of the diameter), else a default bean
const TAP_REACH = 0.18;
const TAP_BEAN_SHARE = 0.2;
const TAP_BEAN_ASPECT = 1.5;

const CROP_CIRCLE = { x: DETECT_SIZE / 2, y: DETECT_SIZE / 2, r: DETECT_SIZE / 2 };

export type Check = { step: TrackStep; frameCircle: Circle; pose: BeanPose | null; ms: number };

function toFrame(fc: Circle, p: { x: number; y: number; major: number; minor: number; angle: number }): BeanPose {
  const k = (fc.r * 2) / DETECT_SIZE;
  return { x: fc.x - fc.r + p.x * k, y: fc.y - fc.r + p.y * k, major: p.major * k, minor: p.minor * k, angle: p.angle };
}

function detectIn(src: FrameSource, fc: Circle, crop: CanvasRenderingContext2D): BeanCandidate[] {
  cropCircle(src, fc, crop, DETECT_SIZE);
  const img = crop.getImageData(0, 0, DETECT_SIZE, DETECT_SIZE);
  return detectBean(img, CROP_CIRCLE).candidates;
}

export function checkFrame(src: FrameSource, m: Mapping, screenCircle: Circle, crop: CanvasRenderingContext2D, prev: TrackState, now: number): Check {
  const t0 = performance.now();
  const fc = circleInSource(m, screenCircle);
  const best = detectIn(src, fc, crop)[0] ?? null;
  const step = track(prev, best, now, CROP_CIRCLE.r);
  const pose = step.state.pose ? toFrame(fc, step.state.pose) : null;
  return { step, frameCircle: fc, pose, ms: performance.now() - t0 };
}

// On lock: look again on the frozen frame, keep the candidate nearest the expected spot
export function refine(src: FrameSource, m: Mapping, screenCircle: Circle, crop: CanvasRenderingContext2D, near: Point, reach: number): BeanPose | null {
  const fc = circleInSource(m, screenCircle);
  let best: BeanPose | null = null;
  let bestD = reach;
  for (const cd of detectIn(src, fc, crop)) {
    const pose = toFrame(fc, cd);
    const d = Math.hypot(pose.x - near.x, pose.y - near.y);
    if (d <= bestD) {
      best = pose;
      bestD = d;
    }
  }
  return best;
}

// "Tap the bean": the nearest candidate to the tap, or a bean-sized pose right there
export function poseAtTap(src: FrameSource, m: Mapping, screenCircle: Circle, crop: CanvasRenderingContext2D, tap: Point): BeanPose {
  const fc = circleInSource(m, screenCircle);
  const found = refine(src, m, screenCircle, crop, tap, TAP_REACH * fc.r * 2);
  if (found) return found;
  const major = TAP_BEAN_SHARE * fc.r * 2;
  return { x: tap.x, y: tap.y, major, minor: major / TAP_BEAN_ASPECT, angle: 0 };
}
