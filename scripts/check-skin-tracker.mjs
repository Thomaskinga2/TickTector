// Checks the skin tracker on generated skin textures. Run: node scripts/check-skin-tracker.mjs
// Plain .mjs on purpose: Node 24 loads the .ts module directly, and no test framework is needed.
import { estimateShift, greyCrop, SKIN_TRACKER } from "../lib/capture/skin-tracker.ts";

const N = SKIN_TRACKER.SIZE;
const BIG = 160;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Blurred random blotches over a skin tone, like pores and creases seen up close
function skin(seed, contrast = 1) {
  const R = rng(seed);
  const raw = new Float32Array(BIG * BIG).map(() => R());
  const out = new Float32Array(BIG * BIG);
  for (let y = 0; y < BIG; y++)
    for (let x = 0; x < BIG; x++) {
      let s = 0;
      let n = 0;
      for (let j = -2; j <= 2; j++)
        for (let i = -2; i <= 2; i++) {
          const xx = Math.min(BIG - 1, Math.max(0, x + i));
          const yy = Math.min(BIG - 1, Math.max(0, y + j));
          s += raw[yy * BIG + xx];
          n++;
        }
      out[y * BIG + x] = 170 + (s / n - 0.5) * 120 * contrast;
    }
  return out;
}

// An N x N view of the texture at (ox, oy), bilinear so shifts can be fractional
function view(tex, ox, oy, { gain = 1, noise = 0, seed = 1 } = {}) {
  const R = rng(seed);
  const data = new Uint8ClampedArray(N * N * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const fx = x + ox;
      const fy = y + oy;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const ax = fx - x0;
      const ay = fy - y0;
      const at = (i, j) => tex[(y0 + j) * BIG + (x0 + i)];
      const v = (at(0, 0) * (1 - ax) + at(1, 0) * ax) * (1 - ay) + (at(0, 1) * (1 - ax) + at(1, 1) * ax) * ay;
      const g = v * gain + (R() - 0.5) * noise;
      const k = (y * N + x) * 4;
      data[k] = g * 1.15;
      data[k + 1] = g * 0.95;
      data[k + 2] = g * 0.8;
      data[k + 3] = 255;
    }
  return { width: N, height: N, data };
}

function shiftBetween(a, b) {
  const p = greyCrop(a);
  const c = greyCrop(b);
  return estimateShift(p.grey, c.grey, N, c.texture);
}

// The picture moving right by d means the view origin moves left: content lands d further right
const tex = skin(7);
const cases = [
  ["stays put on a still picture", () => {
    const s = shiftBetween(view(tex, 40, 40, { noise: 6, seed: 1 }), view(tex, 40, 40, { noise: 6, seed: 2 }));
    return [s.confident && Math.hypot(s.dx, s.dy) < 0.35, s];
  }],
  ["follows a 3 px move to the right", () => {
    const s = shiftBetween(view(tex, 40, 40), view(tex, 37, 40));
    return [s.confident && Math.abs(s.dx - 3) < 0.35 && Math.abs(s.dy) < 0.35, s];
  }],
  ["follows a diagonal move", () => {
    const s = shiftBetween(view(tex, 40, 40), view(tex, 44, 35));
    return [s.confident && Math.abs(s.dx + 4) < 0.35 && Math.abs(s.dy - 5) < 0.35, s];
  }],
  ["follows a sub-pixel move", () => {
    const s = shiftBetween(view(tex, 40, 40), view(tex, 38.5, 40.6));
    return [s.confident && Math.abs(s.dx - 1.5) < 0.4 && Math.abs(s.dy + 0.6) < 0.4, s];
  }],
  ["ignores a change in exposure", () => {
    const s = shiftBetween(view(tex, 40, 40), view(tex, 38, 40, { gain: 0.8 }));
    return [s.confident && Math.abs(s.dx - 2) < 0.4 && Math.abs(s.dy) < 0.4, s];
  }],
  ["copes with sensor noise", () => {
    const s = shiftBetween(view(tex, 40, 40, { noise: 14, seed: 3 }), view(tex, 42, 39, { noise: 14, seed: 4 }));
    return [s.confident && Math.abs(s.dx + 2) < 0.5 && Math.abs(s.dy - 1) < 0.5, s];
  }],
  ["reports no motion on featureless skin", () => {
    const flat = skin(9, 0.02);
    const s = shiftBetween(view(flat, 40, 40), view(flat, 36, 40));
    return [!s.confident && s.dx === 0 && s.dy === 0, s];
  }],
];

let failed = 0;
const rows = [];
for (const [name, run] of cases) {
  const [ok, s] = run();
  if (!ok) failed++;
  rows.push([ok ? "PASS" : "FAIL", name, `dx ${s.dx.toFixed(2)} dy ${s.dy.toFixed(2)} ${s.confident ? "confident" : "not confident"}`]);
}
const a = greyCrop(view(tex, 40, 40));
const b = greyCrop(view(tex, 37, 41));
const runs = 200;
const t0 = performance.now();
for (let i = 0; i < runs; i++) estimateShift(a.grey, b.grey, N, b.texture);
const per = (performance.now() - t0) / runs;

const w = Math.max(...rows.map((r) => r[1].length));
console.log(`\n${"".padEnd(6)}${"case".padEnd(w + 2)}result`);
for (const [s, n, what] of rows) console.log(`${s.padEnd(6)}${n.padEnd(w + 2)}${what}`);
console.log(`\n${cases.length - failed}/${cases.length} passed; estimateShift on ${N} px crops: ${per.toFixed(2)} ms per check (Node)`);
process.exit(failed ? 1 : 0);
