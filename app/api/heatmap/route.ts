import { connection } from "next/server";
import { HEATMAP, isDemoMode } from "@/lib/mock-data";
import { heatmap } from "@/lib/risk-model";

// GET /api/heatmap -> HeatmapPoint[] (one per town, county-based level)
export async function GET() {
  // Levels drop in winter, so compute per request instead of at build time.
  await connection();
  return Response.json(isDemoMode() ? HEATMAP : heatmap());
}
