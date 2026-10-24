import { connection } from "next/server";
import { getAllCountyRisks } from "@/lib/providers/risk";

// GET /api/risk/counties -> CountyRisk[] (one per DPH reporting group, this week)
export async function GET() {
  // Runs per request: the levels depend on this week's forecast.
  await connection();
  return Response.json(await getAllCountyRisks());
}
