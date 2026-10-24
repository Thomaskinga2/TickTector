import type { HeatmapPoint } from "@/lib/types";
import { getJson } from "./http";

export function getHeatmap(): Promise<HeatmapPoint[]> {
  return getJson("/api/heatmap");
}
