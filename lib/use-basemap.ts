"use client";

import { getJson } from "@/lib/services/http";
import { useAsync } from "@/lib/use-async";

// TickTector's own vector basemap (public/map/massachusetts.json, built by scripts/build-map.mjs from
// US Census boundaries). Coordinates are GeoJSON order: [lng, lat].
type Position = [number, number];
type MultiPolygon = { type: "MultiPolygon"; coordinates: Position[][][] };
type Feature<P> = { type: "Feature"; properties: P; geometry: MultiPolygon };

export type BasemapTown = Feature<{ id: string; name: string; county: string; label: Position }>;
export type Basemap = {
  source: string;
  state: Feature<{ name: string }>;
  neighbors: { features: Feature<{ name: string }>[] };
  counties: { features: Feature<{ name: string; label: Position }>[] };
  towns: { features: BasemapTown[] };
};

// One download per visit: the file is static, so every map on every screen shares it.
let pending: Promise<Basemap> | null = null;
function loadBasemap() {
  pending ??= getJson<Basemap>("/map/massachusetts.json").catch((err) => {
    pending = null;
    throw err;
  });
  return pending;
}

export function useBasemap() {
  return useAsync(loadBasemap, []);
}
