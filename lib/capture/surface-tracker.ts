// Keeps the simulated tick stuck to the surface: estimates how far the picture moved between two
// small grey crops of the viewfinder (block matching), so the tick can move with it.
// Pure, like the rest of lib/capture's maths; checked by scripts/check-surface-tracker.mjs.

export type RgbaImage = { width: number; height: number; data: ArrayLike<number> };
export type Shift = { dx: number; dy: number; confident: boolean };

export const SURFACE_TRACKER = {
  SIZE: 64, // crops are downscaled to SIZE x SIZE
  MAX_SHIFT: 6, // largest move searched between two checks, in crop pixels
  MIN_TEXTURE: 2.5, // mean absolute deviation below this: featureless, do not trust a match
  MIN_GAIN: 0.12, // the best match must beat the average one by this share
} as const;

// Grey levels with the mean taken out, so a change in exposure is not read as motion
export function greyCrop(img: RgbaImage): { grey: Float32Array; texture: number } {
  const n = img.width * img.height;
  const grey = new Float32Array(n);
  let sum = 0;
  for (let k = 0; k < n; k++) {
    const v = 0.299 * img.data[k * 4] + 0.587 * img.data[k * 4 + 1] + 0.114 * img.data[k * 4 + 2];
    grey[k] = v;
    sum += v;
  }
  const mean = sum / n;
  let dev = 0;
  for (let k = 0; k < n; k++) {
    grey[k] -= mean;
    dev += Math.abs(grey[k]);
  }
  return { grey, texture: dev / n };
}

function sad(prev: Float32Array, cur: Float32Array, size: number, m: number, dx: number, dy: number): number {
  let s = 0;
  for (let y = m; y < size - m; y++) {
    const row = y * size;
    const rowC = (y + dy) * size + dx;
    for (let x = m; x < size - m; x++) s += Math.abs(cur[rowC + x] - prev[row + x]);
  }
  return s;
}

// Sub-pixel refinement: the vertex of a parabola through three costs
const vertex = (a: number, b: number, c: number): number => {
  const d = a - 2 * b + c;
  return d > 0 ? Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / d)) : 0;
};

// How far the content of prev moved to land in cur (crop pixels). size x size crops.
export function estimateShift(prev: Float32Array, cur: Float32Array, size: number, texture: number): Shift {
  const M = SURFACE_TRACKER.MAX_SHIFT;
  if (texture < SURFACE_TRACKER.MIN_TEXTURE) return { dx: 0, dy: 0, confident: false };
  const W = 2 * M + 1;
  const cost = new Float64Array(W * W);
  let best = Infinity;
  let bx = 0;
  let by = 0;
  let total = 0;
  for (let dy = -M; dy <= M; dy++) {
    for (let dx = -M; dx <= M; dx++) {
      const s = sad(prev, cur, size, M, dx, dy);
      cost[(dy + M) * W + dx + M] = s;
      total += s;
      if (s < best) {
        best = s;
        bx = dx;
        by = dy;
      }
    }
  }
  const avg = total / (W * W);
  if (avg <= 0 || (avg - best) / avg < SURFACE_TRACKER.MIN_GAIN) return { dx: 0, dy: 0, confident: false };
  const at = (dx: number, dy: number) => cost[(dy + M) * W + dx + M];
  const fx = bx > -M && bx < M ? vertex(at(bx - 1, by), best, at(bx + 1, by)) : 0;
  const fy = by > -M && by < M ? vertex(at(bx, by - 1), best, at(bx, by + 1)) : 0;
  return { dx: bx + fx, dy: by + fy, confident: true };
}
