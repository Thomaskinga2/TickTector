import type { HeatmapPoint, MapShapes } from "@/lib/types";
import { getJson } from "./http";

export function getHeatmap(): Promise<HeatmapPoint[]> {
  return getJson("/api/heatmap");
}

// Static file (~100 KB), cached by the browser.
export function getMapShapes(): Promise<MapShapes> {
  return getJson("/geo/ma-towns.json");
}
