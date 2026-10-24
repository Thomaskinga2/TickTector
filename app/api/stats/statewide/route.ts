import { connection } from "next/server";
import { isDemoMode, STATEWIDE_STATS } from "@/lib/mock-data";
import { statewideStats } from "@/lib/risk-model";

// GET /api/stats/statewide -> StatewideStats (cases per year + county ranking)
export async function GET() {
  // Levels drop in winter, so compute per request instead of at build time.
  await connection();
  return Response.json(isDemoMode() ? STATEWIDE_STATS : statewideStats());
}
