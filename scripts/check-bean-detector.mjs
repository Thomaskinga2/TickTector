// Checks the bean detector on generated images. Run: node scripts/check-bean-detector.mjs
// Plain .mjs on purpose: Node 24 loads the .ts modules directly, and no test framework is needed.
import { detectBean } from "../lib/capture/bean-detector.ts";
import { NO_TRACK, track } from "../lib/capture/bean-tracker.ts";

const SIZE = 160;
const CIRCLE = { x: 80, y: 80, r: 80 };

// seeded random numbers, so every run sees the same images
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (R) => Math.sqrt(-2 * Math.log(R() + 1e-9)) * Math.cos(2 * Math.PI * R());

function image(bg) {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const [r, g, b] = bg(x, y);
      const i = (y * SIZE + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  return { width: SIZE, height: SIZE, data };
}
const skin = (x, y) => [214 - y * 0.12 + x * 0.05, 166 - y * 0.1, 136 - y * 0.08];
const paper = (x, y) => [236 - x * 0.04, 234 - x * 0.04, 226 - y * 0.03];

// soft-edged filled ellipse; highlight draws the glossy spot of a black bean
function ellipse(img, { x, y, a, b, angle = 0, rgb, highlight = false }) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let j = 0; j < SIZE; j++)
    for (let i = 0; i < SIZE; i++) {
      const u = ((i + 0.5 - x) * cos + (j + 0.5 - y) * sin) / a;
      const v = (-(i + 0.5 - x) * sin + (j + 0.5 - y) * cos) / b;
      const d = Math.sqrt(u * u + v * v);
      const edge = Math.min(a, b);
      const cover = Math.max(0, Math.min(1, (1 - d) * edge + 0.5));
      if (cover <= 0) continue;
      let col = rgb;
      if (highlight) {
        const hd = Math.hypot(u + 0.35, v + 0.35);
        if (hd < 0.25) col = col.map((c) => c + (1 - hd / 0.25) * 150);
      }
      const k = (j * SIZE + i) * 4;
      for (let c = 0; c < 3; c++) img.data[k + c] = img.data[k + c] * (1 - cover) + col[c] * cover;
    }
  return img;
}
function noise(img, sigma, seed) {
  const R = rng(seed);
  for (let k = 0; k < img.data.length; k += 4) {
    const n = gauss(R) * sigma;
    for (let c = 0; c < 3; c++) img.data[k + c] += n + gauss(R) * sigma * 0.3;
  }
  return img;
}
function scale(img, f) {
  for (let k = 0; k < img.data.length; k += 4) for (let c = 0; c < 3; c++) img.data[k + c] *= f;
  return img;
}
// skin creases and hairs: thin, darker, long
function creases(img, seed) {
  const R = rng(seed);
  for (let n = 0; n < 6; n++) ellipse(img, { x: 20 + R() * 120, y: 20 + R() * 120, a: 18 + R() * 20, b: 0.8, angle: R() * 3, rgb: [150, 100, 80] });
  return img;
}

const BLACK_BEAN = { a: 15, b: 9.5, rgb: [38, 28, 32], highlight: true };
const COFFEE = { a: 13, b: 9.5, rgb: [92, 58, 38] };
const near = (best, x, y, tol = 3) => best && Math.hypot(best.x - x, best.y - y) <= tol;

const cases = [
  ["finds a bean on skin", () => {
    const d = detectBean(noise(ellipse(image(skin), { x: 88, y: 72, angle: 0.5, ...BLACK_BEAN }), 6, 1), CIRCLE);
    return [near(d.best, 88, 72) && Math.abs(d.best.major - 30) < 5, d];
  }],
  ["finds a bean on paper", () => {
    const d = detectBean(noise(ellipse(image(paper), { x: 70, y: 92, angle: -0.3, ...COFFEE }), 5, 2), CIRCLE);
    return [near(d.best, 70, 92), d];
  }],
  ["finds nothing in an empty frame", () => {
    const d = detectBean(noise(creases(image(skin), 3), 6, 3), CIRCLE);
    return [d.best === null, d];
  }],
  ["ignores a round mole", () => {
    const d = detectBean(noise(ellipse(image(skin), { x: 80, y: 80, a: 10, b: 9.6, rgb: [92, 60, 45] }), 6, 4), CIRCLE);
    return [d.best === null, d];
  }],
  ["ignores a long thin shadow", () => {
    const img = ellipse(image(skin), { x: 78, y: 84, a: 42, b: 5, angle: 1.1, rgb: [96, 66, 52] });
    const d = detectBean(noise(img, 6, 5), CIRCLE);
    return [d.best === null, d];
  }],
  ["ignores a soft shadow between fingers", () => {
    // wide, blurry and only somewhat darker: three stacked ellipses fake the soft falloff
    const img = image(skin);
    for (const [k, a] of [[1, 0.25], [0.8, 0.35], [0.6, 0.45]])
      ellipse(img, { x: 80, y: 80, a: 30 * k + 6, b: 16 * k + 4, angle: 0.4, rgb: [214 * (1 - a), 166 * (1 - a), 136 * (1 - a)].map((c, i) => c * 0.5 + [214, 166, 136][i] * 0.5 * (1 - a)) });
    const d = detectBean(noise(img, 6, 11), CIRCLE);
    return [d.best === null, d];
  }],
  ["finds a bean with a hair across it", () => {
    const img = ellipse(image(skin), { x: 80, y: 84, angle: -0.4, ...BLACK_BEAN });
    ellipse(img, { x: 80, y: 84, a: 60, b: 0.7, angle: 0.9, rgb: [60, 40, 30] });
    const d = detectBean(noise(img, 6, 12), CIRCLE);
    return [near(d.best, 80, 84), d];
  }],
  ["ignores a bean outside the circle", () => {
    const d = detectBean(noise(ellipse(image(skin), { x: 14, y: 16, angle: 0.8, ...BLACK_BEAN }), 6, 6), CIRCLE);
    return [d.best === null, d];
  }],
  ["ignores a blob touching the circle's edge", () => {
    const d = detectBean(noise(ellipse(image(skin), { x: 80, y: 152, angle: 0.1, ...BLACK_BEAN }), 6, 7), CIRCLE);
    return [d.best === null, d];
  }],
  ["picks the central one of two beans", () => {
    const img = ellipse(image(paper), { x: 84, y: 86, angle: 1.2, ...BLACK_BEAN });
    ellipse(img, { x: 40, y: 50, angle: 0.2, ...COFFEE });
    const d = detectBean(noise(img, 5, 8), CIRCLE);
    return [near(d.best, 84, 86) && d.candidates.length === 2, d];
  }],
  ["still finds a bean in dim light", () => {
    const img = scale(ellipse(image(skin), { x: 76, y: 82, angle: 2.1, ...BLACK_BEAN }), 0.3);
    const d = detectBean(noise(img, 3, 9), CIRCLE);
    return [near(d.best, 76, 82), d];
  }],
  ["gives a stable box across jittered frames", () => {
    const R = rng(10);
    const boxes = [];
    let last;
    for (let f = 0; f < 12; f++) {
      const x = 82 + (R() - 0.5) * 2;
      const y = 78 + (R() - 0.5) * 2;
      last = detectBean(noise(ellipse(image(skin), { x, y, angle: 0.6 + (R() - 0.5) * 0.06, ...BLACK_BEAN }), 6, 100 + f), CIRCLE);
      if (!near(last.best, x, y, 2)) return [false, last];
      boxes.push(last.best);
    }
    const spread = (k) => Math.max(...boxes.map((b) => b[k])) - Math.min(...boxes.map((b) => b[k]));
    return [spread("major") < 3 && spread("minor") < 3, last];
  }],
  ["tracker locks after half a second steady", () => {
    const d = detectBean(noise(ellipse(image(skin), { x: 88, y: 72, angle: 0.5, ...BLACK_BEAN }), 6, 1), CIRCLE);
    let st = NO_TRACK;
    const steps = [];
    for (let t = 0; t <= 0.61; t += 1 / 12) {
      const s = track(st, d.best, t, CIRCLE.r);
      st = s.state;
      steps.push(s.locked);
    }
    return [!steps.slice(0, 6).some(Boolean) && steps[steps.length - 1], d];
  }],
  ["tracker restarts when the candidate jumps", () => {
    const a = detectBean(noise(ellipse(image(skin), { x: 88, y: 72, angle: 0.5, ...BLACK_BEAN }), 6, 1), CIRCLE).best;
    const b = { ...a, x: a.x - 40 };
    let st = track(NO_TRACK, a, 0, CIRCLE.r).state;
    st = track(st, a, 0.4, CIRCLE.r).state;
    const s = track(st, b, 0.5, CIRCLE.r);
    return [!s.locked && s.progress === 0, null];
  }],
];

let failed = 0;
const rows = [];
const t0 = performance.now();
for (const [name, run] of cases) {
  const [ok, d] = run();
  if (!ok) failed++;
  const b = d?.best;
  const what = b
    ? `bean at ${b.x.toFixed(1)},${b.y.toFixed(1)} ${b.major.toFixed(1)}x${b.minor.toFixed(1)} aspect ${b.aspect.toFixed(2)} fill ${b.fill.toFixed(2)} contrast ${b.contrast.toFixed(2)}`
    : d
      ? `none${d.rejected.length ? ` (rejected: ${d.rejected.map((r) => r.reason).join(", ")})` : ""}`
      : "";
  rows.push([ok ? "PASS" : "FAIL", name, what]);
}
const total = performance.now() - t0;

// cost per check on one 160 px crop
const bench = noise(ellipse(image(skin), { x: 88, y: 72, angle: 0.5, ...BLACK_BEAN }), 6, 1);
const runs = 200;
const b0 = performance.now();
for (let i = 0; i < runs; i++) detectBean(bench, CIRCLE);
const per = (performance.now() - b0) / runs;

const w = Math.max(...rows.map((r) => r[1].length));
console.log(`\n${"".padEnd(6)}${"case".padEnd(w + 2)}result`);
for (const [s, n, what] of rows) console.log(`${s.padEnd(6)}${n.padEnd(w + 2)}${what}`);
console.log(`\n${cases.length - failed}/${cases.length} passed in ${total.toFixed(0)} ms; detectBean on a ${SIZE} px crop: ${per.toFixed(2)} ms per check (Node)`);
process.exit(failed ? 1 : 0);
