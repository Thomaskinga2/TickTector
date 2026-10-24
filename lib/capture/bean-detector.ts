// Finds a dark bean inside the viewfinder circle. A pure function over an RGBA image, so it runs
// the same in the browser and in scripts/check-bean-detector.mjs. Design: reference/bean-detector.md.
//
// 1. Luminance, lightly blurred, inside the circle only.
// 2. Local background: a box mean, taken a second time without the dark seeds so a big bean
//    does not darken its own background.
// 3. Dark mask: clearly darker than that local background, by ratio and by an absolute step.
// 4. Holes filled (a glossy bean's highlight), then a small opening drops specks and hairs.
// 5. Connected blobs, each fitted with an ellipse from its moments, then filtered on edge
//    contact, size, shape, outline, contrast and colour. The survivor nearest the centre wins.

export type RgbaImage = { width: number; height: number; data: ArrayLike<number> };
export type DetectCircle = { x: number; y: number; r: number };
export type BeanCandidate = {
  x: number;
  y: number;
  major: number; // full axis lengths, image pixels
  minor: number;
  angle: number; // major axis direction, radians
  area: number;
  areaShare: number; // of the circle
  aspect: number;
  fill: number; // share of the fitted ellipse the blob covers
  spill: number; // share of the blob outside the fitted ellipse
  roughness: number; // outline length over the ellipse's perimeter
  contrast: number; // blob luminance over the ring around it
  rgb: [number, number, number];
};
export type Rejection = { reason: string; x: number; y: number; area: number };
export type Detection = { best: BeanCandidate | null; candidates: BeanCandidate[]; rejected: Rejection[] };

// Every threshold, named. Shares are of the circle radius or area unless noted.
export const DETECTOR = {
  BG_WINDOW_SHARE: 0.35, // half-width of the local background window
  SEED_RATIO: 0.7, // first pass: darker than this share of the local mean
  DARK_RATIO: 0.62, // second pass: darker than this share of the local background
  MIN_STEP: 16, // ...and at least this many luminance levels darker (0-255)
  EDGE_SHARE: 0.04, // a blob reaching this close to the circle's edge touches it
  MIN_AREA_SHARE: 0.003,
  MAX_AREA_SHARE: 0.2,
  MIN_ASPECT: 1.18, // rounder than this is a mole or a dot
  MAX_ASPECT: 2.6, // longer than this is a shadow, a hair or a nail edge
  MIN_FILL: 0.8,
  MAX_SPILL: 0.16,
  MAX_ROUGHNESS: 1.3,
  MAX_CONTRAST: 0.58, // blob over ring luminance: a bean is much darker than what is around it
  RING_INNER: 1.3, // ring around the blob, in ellipse radii
  RING_OUTER: 1.9,
  MAX_BLUE_EXCESS: 18, // blue above red and green: ink, denim, navy cloth
  MAX_GREEN_EXCESS: 18,
} as const;

const luma = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;

type Grid = { w: number; h: number; inside: Uint8Array; y: Float32Array };

function prepare(img: RgbaImage, c: DetectCircle): Grid {
  const { width: w, height: h, data } = img;
  const inside = new Uint8Array(w * h);
  const raw = new Float32Array(w * h);
  const r2 = c.r * c.r;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      const dx = i + 0.5 - c.x;
      const dy = j + 0.5 - c.y;
      if (dx * dx + dy * dy > r2) continue;
      inside[k] = 1;
      raw[k] = luma(data[k * 4], data[k * 4 + 1], data[k * 4 + 2]);
    }
  }
  // 3x3 mean over inside pixels: sensor noise out, edges kept
  const y = new Float32Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      if (!inside[k]) continue;
      let s = 0;
      let n = 0;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const ii = i + di;
          const jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue;
          const kk = jj * w + ii;
          if (!inside[kk]) continue;
          s += raw[kk];
          n++;
        }
      }
      y[k] = s / n;
    }
  }
  return { w, h, inside, y };
}

// Box mean of y over pixels where mask is set, half-width rad, via integral images
function boxMean(g: Grid, mask: Uint8Array, rad: number): Float32Array {
  const { w, h, y } = g;
  const W1 = w + 1;
  const S = new Float64Array(W1 * (h + 1));
  const C = new Float64Array(W1 * (h + 1));
  for (let j = 0; j < h; j++) {
    let rs = 0;
    let rc = 0;
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      if (mask[k]) {
        rs += y[k];
        rc++;
      }
      S[(j + 1) * W1 + i + 1] = S[j * W1 + i + 1] + rs;
      C[(j + 1) * W1 + i + 1] = C[j * W1 + i + 1] + rc;
    }
  }
  const out = new Float32Array(w * h);
  for (let j = 0; j < h; j++) {
    const j0 = Math.max(0, j - rad);
    const j1 = Math.min(h, j + rad + 1);
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      if (!g.inside[k]) continue;
      const i0 = Math.max(0, i - rad);
      const i1 = Math.min(w, i + rad + 1);
      const s = S[j1 * W1 + i1] - S[j0 * W1 + i1] - S[j1 * W1 + i0] + S[j0 * W1 + i0];
      const n = C[j1 * W1 + i1] - C[j0 * W1 + i1] - C[j1 * W1 + i0] + C[j0 * W1 + i0];
      out[k] = n > 0 ? s / n : -1;
    }
  }
  return out;
}

function darkMask(g: Grid, rad: number): Uint8Array {
  const { w, h, inside, y } = g;
  const n = w * h;
  const bg1 = boxMean(g, inside, rad);
  // background pixels: inside and not a dark seed (nor right next to one)
  const seed = new Uint8Array(n);
  for (let k = 0; k < n; k++) if (inside[k] && y[k] < DETECTOR.SEED_RATIO * bg1[k]) seed[k] = 1;
  const keep = new Uint8Array(n);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      if (!inside[k] || seed[k]) continue;
      const near = (i > 0 && seed[k - 1]) || (i < w - 1 && seed[k + 1]) || (j > 0 && seed[k - w]) || (j < h - 1 && seed[k + w]);
      if (!near) keep[k] = 1;
    }
  }
  const bg2 = boxMean(g, keep, rad);
  const dark = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    if (!inside[k]) continue;
    const bg = bg2[k] > 0 ? bg2[k] : bg1[k];
    if (y[k] < DETECTOR.DARK_RATIO * bg && bg - y[k] >= DETECTOR.MIN_STEP) dark[k] = 1;
  }
  return dark;
}

// Light pixels the outside cannot reach are holes in a blob (a highlight): make them dark
function fillHoles(g: Grid, dark: Uint8Array): void {
  const { w, h, inside } = g;
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let top = 0;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      if (!inside[k] || dark[k]) continue;
      const rim = i === 0 || j === 0 || i === w - 1 || j === h - 1 || !inside[k - 1] || !inside[k + 1] || !inside[k - w] || !inside[k + w];
      if (rim) {
        seen[k] = 1;
        stack[top++] = k;
      }
    }
  }
  while (top > 0) {
    const k = stack[--top];
    const i = k % w;
    for (const kk of [i > 0 ? k - 1 : -1, i < w - 1 ? k + 1 : -1, k - w, k + w]) {
      if (kk < 0 || kk >= w * h || seen[kk] || !inside[kk] || dark[kk]) continue;
      seen[kk] = 1;
      stack[top++] = kk;
    }
  }
  for (let k = 0; k < w * h; k++) if (inside[k] && !dark[k] && !seen[k]) dark[k] = 1;
}

// Erode then dilate with a 3x3 cross: drops specks and one-pixel hairs, smooths outlines
function open(w: number, h: number, m: Uint8Array): Uint8Array {
  const at = (i: number, j: number) => (i >= 0 && j >= 0 && i < w && j < h ? m[j * w + i] : 0);
  const er = new Uint8Array(w * h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) er[j * w + i] = at(i, j) && at(i - 1, j) && at(i + 1, j) && at(i, j - 1) && at(i, j + 1) ? 1 : 0;
  const ea = (i: number, j: number) => (i >= 0 && j >= 0 && i < w && j < h ? er[j * w + i] : 0);
  const out = new Uint8Array(w * h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) out[j * w + i] = ea(i, j) || ea(i - 1, j) || ea(i + 1, j) || ea(i, j - 1) || ea(i, j + 1) ? 1 : 0;
  return out;
}

type Blob = { pixels: Int32Array; n: number; touches: boolean };

function blobs(g: Grid, m: Uint8Array, c: DetectCircle): Blob[] {
  const { w, h } = g;
  const label = new Int32Array(w * h).fill(-1);
  const stack = new Int32Array(w * h);
  const edgeR = c.r * (1 - DETECTOR.EDGE_SHARE);
  const edge2 = edgeR * edgeR;
  const out: Blob[] = [];
  for (let s = 0; s < w * h; s++) {
    if (!m[s] || label[s] >= 0) continue;
    const id = out.length;
    const pixels: number[] = [];
    let touches = false;
    let top = 0;
    stack[top++] = s;
    label[s] = id;
    while (top > 0) {
      const k = stack[--top];
      pixels.push(k);
      const i = k % w;
      const j = (k - i) / w;
      const dx = i + 0.5 - c.x;
      const dy = j + 0.5 - c.y;
      if (dx * dx + dy * dy > edge2) touches = true;
      for (const kk of [i > 0 ? k - 1 : -1, i < w - 1 ? k + 1 : -1, j > 0 ? k - w : -1, j < h - 1 ? k + w : -1]) {
        if (kk < 0 || !m[kk] || label[kk] >= 0) continue;
        label[kk] = id;
        stack[top++] = kk;
      }
    }
    out.push({ pixels: Int32Array.from(pixels), n: pixels.length, touches });
  }
  return out;
}

function measure(img: RgbaImage, g: Grid, m: Uint8Array, b: Blob, circleArea: number): BeanCandidate {
  const { w } = g;
  let sx = 0;
  let sy = 0;
  for (const k of b.pixels) {
    sx += k % w;
    sy += Math.floor(k / w);
  }
  const mx = sx / b.n;
  const my = sy / b.n;
  let cxx = 0;
  let cyy = 0;
  let cxy = 0;
  let edge = 0;
  let r = 0;
  let gr = 0;
  let bl = 0;
  let yIn = 0;
  const inBlob = new Set<number>();
  for (const k of b.pixels) inBlob.add(k);
  for (const k of b.pixels) {
    const dx = (k % w) - mx;
    const dy = Math.floor(k / w) - my;
    cxx += dx * dx;
    cyy += dy * dy;
    cxy += dx * dy;
    if (!inBlob.has(k - 1) || !inBlob.has(k + 1) || !inBlob.has(k - w) || !inBlob.has(k + w)) edge++;
    r += img.data[k * 4];
    gr += img.data[k * 4 + 1];
    bl += img.data[k * 4 + 2];
    yIn += g.y[k];
  }
  cxx /= b.n;
  cyy /= b.n;
  cxy /= b.n;
  const tr = cxx + cyy;
  const det = Math.sqrt(Math.max(0, ((cxx - cyy) * (cxx - cyy)) / 4 + cxy * cxy));
  const l1 = Math.max(tr / 2 + det, 1e-6);
  const l2 = Math.max(tr / 2 - det, 1e-6);
  const a = 2 * Math.sqrt(l1); // semi-axes of the ellipse with the same second moments
  const bb = 2 * Math.sqrt(l2);
  const angle = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
  // walk the ellipse's box: fill, spill, and the ring's luminance
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const reach = Math.ceil(a * DETECTOR.RING_OUTER) + 1;
  let ellN = 0;
  let ellHit = 0;
  let ringY = 0;
  let ringN = 0;
  for (let j = Math.max(0, Math.floor(my - reach)); j <= Math.min(g.h - 1, Math.ceil(my + reach)); j++) {
    for (let i = Math.max(0, Math.floor(mx - reach)); i <= Math.min(w - 1, Math.ceil(mx + reach)); i++) {
      const k = j * w + i;
      const u = ((i - mx) * cos + (j - my) * sin) / a;
      const v = (-(i - mx) * sin + (j - my) * cos) / bb;
      const d = Math.sqrt(u * u + v * v);
      if (d <= 1) {
        ellN++;
        if (inBlob.has(k)) ellHit++;
      } else if (d >= DETECTOR.RING_INNER && d <= DETECTOR.RING_OUTER && g.inside[k] && !m[k]) {
        ringY += g.y[k];
        ringN++;
      }
    }
  }
  const perimeter = Math.PI * (3 * (a + bb) - Math.sqrt((3 * a + bb) * (a + 3 * bb)));
  return {
    x: mx + 0.5,
    y: my + 0.5,
    major: 2 * a,
    minor: 2 * bb,
    angle,
    area: b.n,
    areaShare: b.n / circleArea,
    aspect: a / bb,
    fill: ellN > 0 ? ellHit / ellN : 0,
    spill: (b.n - ellHit) / b.n,
    roughness: edge / perimeter,
    contrast: ringN > 0 ? yIn / b.n / (ringY / ringN) : 1,
    rgb: [r / b.n, gr / b.n, bl / b.n],
  };
}

// Why a candidate is not a bean, or null if it is one
function rejectReason(cd: BeanCandidate): string | null {
  const D = DETECTOR;
  if (cd.areaShare > D.MAX_AREA_SHARE) return "too big";
  if (cd.aspect < D.MIN_ASPECT) return "too round";
  if (cd.aspect > D.MAX_ASPECT) return "too long";
  if (cd.fill < D.MIN_FILL || cd.spill > D.MAX_SPILL) return "not an oval";
  if (cd.roughness > D.MAX_ROUGHNESS) return "ragged outline";
  if (cd.contrast > D.MAX_CONTRAST) return "not dark enough";
  const [r, g, b] = cd.rgb;
  if (b - Math.max(r, g) > D.MAX_BLUE_EXCESS) return "too blue";
  if (g - Math.max(r, b) > D.MAX_GREEN_EXCESS) return "too green";
  return null;
}

export function detectBean(img: RgbaImage, circle: DetectCircle): Detection {
  const g = prepare(img, circle);
  const rad = Math.max(4, Math.round(circle.r * DETECTOR.BG_WINDOW_SHARE));
  const dark = darkMask(g, rad);
  fillHoles(g, dark);
  const m = open(g.w, g.h, dark);
  const circleArea = Math.PI * circle.r * circle.r;
  const minArea = DETECTOR.MIN_AREA_SHARE * circleArea;
  const candidates: BeanCandidate[] = [];
  const rejected: Rejection[] = [];
  for (const b of blobs(g, m, circle)) {
    if (b.n < minArea) continue; // specks: not worth reporting
    const cd = measure(img, g, m, b, circleArea);
    const reason = b.touches ? "touches the edge" : rejectReason(cd);
    if (reason) rejected.push({ reason, x: cd.x, y: cd.y, area: cd.area });
    else candidates.push(cd);
  }
  const dist = (cd: BeanCandidate) => Math.hypot(cd.x - circle.x, cd.y - circle.y);
  candidates.sort((p, q) => dist(p) - dist(q));
  return { best: candidates[0] ?? null, candidates, rejected };
}
