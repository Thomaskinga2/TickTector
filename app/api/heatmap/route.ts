import { connection } from "next/server";
import { dphCounty, getAllCountyRisks, MA_TOWNS, riskIndex } from "@/lib/providers/risk";
import type { HeatmapPoint } from "@/lib/types";

// GET /api/heatmap -> HeatmapPoint[] (all 351 cities and towns; each takes its county's level this week)
export async function GET() {
  // Runs per request: the levels depend on this week's forecast.
  await connection();
  const byCounty = new Map((await getAllCountyRisks()).map((risk) => [risk.county, riskIndex(risk)]));
  const points: HeatmapPoint[] = MA_TOWNS.map((town) => ({
    townId: town.id,
    lat: town.lat,
    lng: town.lng,
    value: byCounty.get(dphCounty(town.county)) ?? 0,
  }));
  return Response.json(points);
}
