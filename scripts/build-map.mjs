// Builds TickTector's own vector map of Massachusetts (public/map/massachusetts.json)
// and the list of all 351 cities and towns the API serves (lib/data/ma-towns.json).
//
// Source: US Census Bureau cartographic boundary files, 2023, 1:500,000 (public domain):
//   https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_25_cousub_500k.zip  (MA cities and towns)
//   https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_500k.zip   (neighbor states)
// Unzip both into one folder (each into a folder of its own name), then: node scripts/build-map.mjs <folder>
// Counties and the state outline are dissolved from the towns, so no county or MA state file is needed.
//
// No dependencies: a minimal shapefile/dBASE reader, Douglas-Peucker simplification of shared borders,
// 4-decimal rounding (~10 m).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/build-map.mjs <folder with the unzipped Census files>");
  process.exit(1);
}

// Neighbors drawn as muted land so Massachusetts never floats in empty space.
const NEIGHBORS = { "09": "Connecticut", "44": "Rhode Island", "33": "New Hampshire", "50": "Vermont", "36": "New York", "23": "Maine" };
const VIEW = { west: -74.6, south: 40.4, east: -68.8, north: 43.9 };

// --- Readers -------------------------------------------------------------------------------------

function readShp(path) {
  const buf = readFileSync(path);
  const shapes = [];
  let at = 100;
  while (at < buf.length) {
    const length = buf.readInt32BE(at + 4) * 2;
    const rec = at + 8;
    const type = buf.readInt32LE(rec);
    if (type === 5) {
      const numParts = buf.readInt32LE(rec + 36);
      const numPoints = buf.readInt32LE(rec + 40);
      const parts = Array.from({ length: numParts }, (_, i) => buf.readInt32LE(rec + 44 + i * 4));
      const pts = rec + 44 + numParts * 4;
      const rings = parts.map((start, i) => {
        const end = i + 1 < numParts ? parts[i + 1] : numPoints;
        const ring = [];
        for (let p = start; p < end; p++) ring.push([buf.readDoubleLE(pts + p * 16), buf.readDoubleLE(pts + p * 16 + 8)]);
        return ring;
      });
      shapes.push(rings);
    } else {
      shapes.push(null);
    }
    at = rec + length;
  }
  return shapes;
}

function readDbf(path) {
  const buf = readFileSync(path);
  const count = buf.readUInt32LE(4);
  const headerLength = buf.readUInt16LE(8);
  const recordLength = buf.readUInt16LE(10);
  const fields = [];
  for (let at = 32; buf[at] !== 0x0d; at += 32) {
    fields.push({ name: buf.toString("latin1", at, at + 11).replace(/\0.*$/, ""), length: buf[at + 16] });
  }
  const rows = [];
  for (let r = 0; r < count; r++) {
    let at = headerLength + r * recordLength + 1;
    const row = {};
    for (const f of fields) {
      row[f.name] = buf.toString("utf8", at, at + f.length).trim();
      at += f.length;
    }
    rows.push(row);
  }
  return rows;
}

function load(name) {
  const base = join(dir, name, name);
  const shapes = readShp(`${base}.shp`);
  return readDbf(`${base}.dbf`).map((props, i) => ({ props, rings: shapes[i] }));
}

// --- Geometry ------------------------------------------------------------------------------------

function simplify(ring, tolerance) {
  if (ring.length <= 4) return ring;
  const keep = new Uint8Array(ring.length);
  keep[0] = keep[ring.length - 1] = 1;
  const stack = [[0, ring.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = ring[a];
    const [bx, by] = ring[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    let max = 0;
    let index = -1;
    for (let i = a + 1; i < b; i++) {
      // A closed ring starts and ends on the same point: measure from that point instead of a line.
      const d = len < 1e-12
        ? Math.hypot(ring[i][0] - ax, ring[i][1] - ay)
        : Math.abs(dy * ring[i][0] - dx * ring[i][1] + bx * ay - by * ax) / len;
      if (d > max) [max, index] = [d, i];
    }
    if (max > tolerance && index > 0) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  return ring.filter((_, i) => keep[i]);
}

const area = (ring) => ring.reduce((sum, [x1, y1], i) => {
  const [x2, y2] = ring[(i + 1) % ring.length];
  return sum + (x1 * y2 - x2 * y1);
}, 0) / 2;

const round = ([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4];

function inside([x, y], ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// --- Shared borders ------------------------------------------------------------------------------
// In the Census files, neighboring towns (and the neighbor states along the state line) share each border vertex
// for vertex. Simplifying every shape on its own drops different vertices on each side of a border, which opened
// slivers of gap and overlap between towns. So each stretch of border between two junctions is simplified once
// and reused by both sides, and the counties and the state outline are dissolved from the towns: every line in
// the map then sits exactly on the others.

const key = ([x, y]) => `${x},${y}`;

// Which shape owns each directed edge. Rings all wind the same way, so the shape across a border owns its reverse.
function edgeOwners(shapes) {
  const owners = new Map();
  shapes.forEach((rings, s) => {
    for (const ring of rings) for (let i = 0; i < ring.length - 1; i++) owners.set(`${key(ring[i])}|${key(ring[i + 1])}`, s);
  });
  return owners;
}

// Splits a closed ring into chains wherever the shape across the border changes (a junction). The ring's other
// side sees the same junctions, so both sides cut a shared border into the same chains.
function chains(ring, owners) {
  const n = ring.length - 1;
  const across = (i) => owners.get(`${key(ring[i + 1])}|${key(ring[i])}`) ?? -1;
  const junction = (i) => across((i + n - 1) % n) !== across(i);
  let start = [...Array(n).keys()].find(junction);
  // No junction: an island, or a loop shared whole with one neighbor. Start where both sides would: the lowest vertex.
  if (start === undefined) start = [...Array(n).keys()].reduce((a, i) => (key(ring[i]) < key(ring[a]) ? i : a), 0);
  const out = [];
  let chain = [ring[start]];
  for (let step = 1; step <= n; step++) {
    const i = (start + step) % n;
    chain.push(ring[i]);
    if (step === n || junction(i)) {
      out.push(chain);
      chain = [ring[i]];
    }
  }
  return { chains: out, coast: out.length === 1 && across(start) === -1 };
}

// Simplifies a chain once; the neighbor's copy (the same chain reversed) gets the identical result.
const simplified = new Map();
function simplifyChain(chain, tolerance) {
  const id = (c) => [c[0], c[1], c.at(-2), c.at(-1)].map(key).join("|") + `|${c.length}`;
  const reversed = simplified.get(id(chain.slice().reverse()));
  if (reversed) return reversed.slice().reverse();
  let result = simplified.get(id(chain));
  if (!result) {
    result = simplify(chain, tolerance);
    // A closed loop needs at least a triangle; keep a tiny one as it is.
    if (key(chain[0]) === key(chain.at(-1)) && result.length < 4) result = chain;
    simplified.set(id(chain), result);
  }
  return result;
}

// One shape (its shapefile rings) as a GeoJSON MultiPolygon, built from shared chains.
// Shapefile outer rings run clockwise (negative signed area), holes counterclockwise; GeoJSON wants the reverse.
// Islands smaller than minArea are dropped (only whole-coast rings, so no shared border ever goes missing).
function toMultiPolygon(rings, owners, tolerance, { minArea = tolerance * tolerance * 30 } = {}) {
  const clean = [];
  for (const ring of rings) {
    const { chains: parts, coast } = chains(ring, owners);
    const joined = parts.flatMap((c, i) => simplifyChain(c, tolerance).slice(i ? 1 : 0)).map(round);
    const r = joined.filter((p, i) => i === 0 || key(p) !== key(joined[i - 1]));
    if (r.length >= 4 && (!coast || Math.abs(area(r)) > minArea)) clean.push(r);
  }
  return polygons(clean.map((r) => r.slice().reverse()));
}

// Groups counterclockwise outer rings with the clockwise holes inside them.
function polygons(rings) {
  const outers = rings.filter((r) => area(r) > 0).map((r) => [r]);
  for (const hole of rings.filter((r) => area(r) < 0)) {
    const owner = outers.find(([outer]) => inside(hole[0], outer));
    if (owner) owner.push(hole);
  }
  return { type: "MultiPolygon", coordinates: outers };
}

// Merges shapes that share borders (towns into a county, all of them into the state): every edge whose reverse is
// also in the group is interior and dropped; what's left is stitched back into rings.
function dissolve(geometries) {
  const edges = geometries.flatMap((g) => g.coordinates.flat().flatMap((ring) => ring.slice(1).map((p, i) => [ring[i], p])));
  const present = new Set(edges.map(([a, b]) => `${key(a)}|${key(b)}`));
  const outgoing = new Map();
  for (const [a, b] of edges) {
    if (present.has(`${key(b)}|${key(a)}`)) continue;
    if (!outgoing.has(key(a))) outgoing.set(key(a), []);
    outgoing.get(key(a)).push([a, b]);
  }
  const rings = [];
  for (const [startKey, list] of outgoing) {
    while (list.length) {
      const ring = [list[0][0]];
      let at = startKey;
      do {
        const [, b] = outgoing.get(at).pop();
        ring.push(b);
        at = key(b);
      } while (at !== startKey && outgoing.get(at)?.length);
      if (ring.length >= 4) rings.push(ring);
    }
  }
  return polygons(rings);
}

function intersectsView(rings) {
  return rings.some((r) => r.some(([x, y]) => x > VIEW.west && x < VIEW.east && y > VIEW.south && y < VIEW.north));
}

// Distance from a point inside a polygon to its nearest edge, in degrees of latitude (longitude scaled by cos lat),
// negative when the point is outside (or in a hole).
function edgeDistance([x, y], polygon) {
  const k = Math.cos((y * Math.PI) / 180);
  let best = Infinity;
  for (const ring of polygon) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [ax, ay] = ring[i];
      const [bx, by] = ring[i + 1];
      const dx = (bx - ax) * k, dy = by - ay, qx = (x - ax) * k, qy = y - ay;
      const t = Math.max(0, Math.min(1, (qx * dx + qy * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(qx - t * dx, qy - t * dy));
    }
  }
  const within = inside([x, y], polygon[0]) && !polygon.slice(1).some((hole) => inside([x, y], hole));
  return within ? best : -best;
}

// The point deepest inside a polygon (farthest from every edge): a coarse grid, then finer grids around the best.
function deepestPoint(polygon) {
  const xs = polygon[0].map((p) => p[0]);
  const ys = polygon[0].map((p) => p[1]);
  let step = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 32;
  let best = { point: polygon[0][0], d: -Infinity };
  const search = (x0, y0, x1, y1) => {
    for (let x = x0; x <= x1; x += step) for (let y = y0; y <= y1; y += step) {
      const d = edgeDistance([x, y], polygon);
      if (d > best.d) best = { point: [x, y], d };
    }
  };
  search(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
  for (let pass = 0; pass < 4; pass++) {
    const [bx, by] = best.point;
    const span = step * 2;
    step /= 4;
    search(bx - span, by - span, bx + span, by + span);
  }
  return best;
}

// Label point (also where the API places the town): the area-weighted centroid of the largest part when it sits
// well inside; for crescents, hooks and thin coastal towns, whose centroid lands near or past an edge, the point
// deepest inside instead, so the name and the pin always land on the town itself.
function labelPoint(geometry) {
  const polygon = geometry.coordinates.reduce((best, poly) => (Math.abs(area(poly[0])) > Math.abs(area(best[0])) ? poly : best));
  const [outer] = polygon;
  let cx = 0;
  let cy = 0;
  let a = 0;
  outer.forEach(([x1, y1], i) => {
    const [x2, y2] = outer[(i + 1) % outer.length];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  });
  const centroid = [cx / (3 * a), cy / (3 * a)];
  const deepest = deepestPoint(polygon);
  return round(edgeDistance(centroid, polygon) >= deepest.d / 2 ? centroid : deepest.point);
}

const slug = (name) => name.replace(/ Town$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const feature = (properties, geometry) => ({ type: "Feature", properties, geometry });

// --- Build ---------------------------------------------------------------------------------------

const towns = load("cb_2023_25_cousub_500k").filter((t) => t.props.COUSUBFP !== "00000");
// Context only: rings entirely outside the view are left out.
const neighbors = load("cb_2023_us_state_500k")
  .filter((s) => NEIGHBORS[s.props.STATEFP])
  .map((s) => ({ ...s, rings: s.rings.filter((r) => intersectsView([r])) }))
  .filter((s) => s.rings.length);
const owners = edgeOwners([...towns, ...neighbors].map((s) => s.rings));

// Towns go first, so the state line they share with a neighbor is simplified at town detail.
const townShapes = towns.map((t) => ({
  id: slug(t.props.NAME),
  name: t.props.NAME.replace(/ Town$/, ""),
  county: t.props.NAMELSADCO.replace(/ County$/, ""),
  geometry: toMultiPolygon(t.rings, owners, 0.0008),
}));
const countyNames = [...new Set(townShapes.map((t) => t.county))].sort();

const map = {
  source: "US Census Bureau, 2023 cartographic boundary files (public domain)",
  state: feature({ name: "Massachusetts" }, dissolve(townShapes.map((t) => t.geometry))),
  neighbors: {
    type: "FeatureCollection",
    // Coarser away from Massachusetts, small islands dropped.
    features: neighbors.map((s) => feature({ name: NEIGHBORS[s.props.STATEFP] }, toMultiPolygon(s.rings, owners, 0.004, { minArea: 0.002 }))),
  },
  counties: {
    type: "FeatureCollection",
    features: countyNames.map((name) => {
      const geometry = dissolve(townShapes.filter((t) => t.county === name).map((t) => t.geometry));
      return feature({ name, label: labelPoint(geometry) }, geometry);
    }),
  },
  towns: {
    type: "FeatureCollection",
    features: townShapes.map(({ id, name, county, geometry }) => feature({ id, name, county, label: labelPoint(geometry) }, geometry)),
  },
};

// The town list the API serves (search, risk, sightings): every MA city and town with its county and label point.
const townList = map.towns.features
  .map(({ properties: p }) => ({ id: p.id, name: p.name, county: p.county, lat: p.label[1], lng: p.label[0] }))
  .sort((a, b) => a.name.localeCompare(b.name));
if (new Set(townList.map((t) => t.id)).size !== townList.length) throw new Error("Duplicate town ids");
mkdirSync("lib/data", { recursive: true });
writeFileSync("lib/data/ma-towns.json", JSON.stringify(townList, null, 0).replace(/\},\{/g, "},\n{") + "\n");

mkdirSync("public/map", { recursive: true });
const json = JSON.stringify(map);
writeFileSync("public/map/massachusetts.json", json);
console.log(`public/map/massachusetts.json: ${(json.length / 1024).toFixed(0)} KB, ${map.towns.features.length} towns, ${map.counties.features.length} counties, ${map.neighbors.features.length} neighbors`);
