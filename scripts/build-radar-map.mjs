// Builds the Massachusetts map inside Home's radar (lib/data/radar-map.json): the state and county outlines as tiny
// SVG paths in the radar's -50..50 viewBox, plus where each DPH county group's blip goes (-1..1, north up).
//
// Source: public/map/massachusetts.json (US Census Bureau 2023 cartographic boundaries, from scripts/build-map.mjs).
// A blip sits on its county's label point (kept well inside the county by build-map.mjs), or deeper in when it
// wouldn't fit there.
//
// Usage: node scripts/build-radar-map.mjs

import { readFileSync, writeFileSync } from "node:fs";

const map = JSON.parse(readFileSync("public/map/massachusetts.json", "utf8"));

const RADIUS = 47; // the state's farthest point from the middle, inside the scope's 49-unit face
const TOLERANCE = 0.35; // Douglas-Peucker, in radar units (the scope is ~136 px across, so under half a pixel)

const rings = (geometry) => (geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates).flat();
const stateRings = rings(map.state.geometry);

// Equirectangular, scaled by cos(latitude) at the middle so the shape isn't stretched.
const all = stateRings.flat();
const lngs = all.map((p) => p[0]);
const lats = all.map((p) => p[1]);
const lng0 = (Math.min(...lngs) + Math.max(...lngs)) / 2;
const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2;
const k = Math.cos((lat0 * Math.PI) / 180);
const raw = ([lng, lat]) => [(lng - lng0) * k, -(lat - lat0)];
const scale = RADIUS / Math.max(...all.map((p) => Math.hypot(...raw(p))));
const project = (p) => raw(p).map((v) => v * scale);

function simplify(points) {
  if (points.length < 3) return points;
  const [a, b] = [points[0], points.at(-1)];
  let index = 0;
  let max = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = len ? Math.abs((b[0] - a[0]) * (a[1] - y) - (a[0] - x) * (b[1] - a[1])) / len : Math.hypot(x - a[0], y - a[1]);
    if (d > max) [index, max] = [i, d];
  }
  if (max <= TOLERANCE) return [a, b];
  return [...simplify(points.slice(0, index + 1)).slice(0, -1), ...simplify(points.slice(index))];
}

const area = (ring) => Math.abs(ring.reduce((s, [x, y], i) => s + x * ring[(i + 1) % ring.length][1] - ring[(i + 1) % ring.length][0] * y, 0)) / 2;
const round = (v) => Math.round(v * 10) / 10;

function path(ringList) {
  return ringList
    .map((ring) => simplify(ring.map(project)))
    // Specks smaller than a blip (tiny islands) would only be noise at this size.
    .filter((ring) => ring.length >= 3 && area(ring) >= 0.6)
    .map((ring) => `M${ring.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}Z`)
    .join("");
}

const BLIP = 2.4; // the largest blip's radius in components/radar.tsx

// How far a point is from the nearest county line (in radar units); negative when it's outside the county.
function clearance(point, countyRings) {
  let inside = false;
  let nearest = Infinity;
  for (const ring of countyRings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [a, b] = [ring[j], ring[i]];
      if (b[1] > point[1] !== a[1] > point[1] && point[0] < ((a[0] - b[0]) * (point[1] - b[1])) / (a[1] - b[1]) + b[0]) inside = !inside;
      const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
      const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
      nearest = Math.min(nearest, Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy));
    }
  }
  return inside ? nearest : -nearest;
}

// The point deepest inside the county, on a fine grid: where a blip has the most room.
function deepest(countyRings) {
  const pts = countyRings.flat();
  const [xs, ys] = [pts.map((p) => p[0]), pts.map((p) => p[1])];
  let best = { point: pts[0], room: -Infinity };
  for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.1) {
    for (let y = Math.min(...ys); y <= Math.max(...ys); y += 0.1) {
      const room = clearance([x, y], countyRings);
      if (room > best.room) best = { point: [x, y], room };
    }
  }
  return best.point;
}

// A blip sits on the county's label point when the whole blip fits there, otherwise at the point deepest inside
// (Suffolk and the islands are smaller than a blip at this size, so it goes where it overlaps the line least).
// Dukes and Nantucket are one DPH reporting group (lib/counties.ts) with one blip: on Martha's Vineyard (Dukes),
// the larger of the two, rather than in the water between them.
const centers = Object.fromEntries(
  map.counties.features
    .filter((f) => f.properties.name !== "Nantucket")
    .map(({ properties: p, geometry }) => {
      const countyRings = rings(geometry).map((ring) => ring.map(project));
      const label = project(p.label);
      const at = clearance(label, countyRings) >= BLIP ? label : deepest(countyRings);
      return [p.name === "Dukes" ? "Dukes & Nantucket" : p.name, at.map((v) => Math.round((v / 50) * 1000) / 1000)];
    }),
);

const out = {
  source: map.source,
  state: path(stateRings),
  counties: path(map.counties.features.flatMap((f) => rings(f.geometry))),
  centers,
};
writeFileSync("lib/data/radar-map.json", JSON.stringify(out, null, 2) + "\n");
console.log(`lib/data/radar-map.json: ${(JSON.stringify(out).length / 1024).toFixed(1)} KB, ${Object.keys(centers).length} county groups`);
