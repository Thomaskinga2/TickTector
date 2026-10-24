import type { LatLngBoundsExpression } from "leaflet";
import towns from "@/lib/data/ma-towns.json";
import type { RiskLevel } from "@/lib/types";

// Massachusetts bounding box, south-west then north-east.
export const MA_BOUNDS: LatLngBoundsExpression = [
  [41.2, -73.5],
  [42.9, -69.9],
];

// Heatmap values are 0..1; these cutoffs match the weekly risk levels.
export function riskFromIndex(value: number): RiskLevel {
  return value >= 0.7 ? "high" : value >= 0.4 ? "moderate" : "low";
}

// Official names of all 351 cities and towns (US Census), bundled: 30 KB, and names never wait on the network.
const NAMES = new Map(towns.map((t) => [t.id, t.name]));
const COUNTIES = new Map(towns.map((t) => [t.id, t.county]));

export function townName(id: string) {
  return NAMES.get(id) ?? decodeURIComponent(id);
}

export function townCounty(id: string) {
  return COUNTIES.get(id);
}
