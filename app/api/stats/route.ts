import type { NextRequest } from "next/server";
import { isDemoMode, TOWN_STATS } from "@/lib/mock-data";
import { findTown, townStats } from "@/lib/risk-model";

// GET /api/stats?town=amherst -> TownStats (the town's county: trend, county vs state, ER visits)
export async function GET(request: NextRequest) {
  const townId = request.nextUrl.searchParams.get("town") ?? "";
  if (isDemoMode()) return Response.json(TOWN_STATS);
  const town = findTown(townId);
  if (!town) return Response.json({ error: "We couldn't find that Massachusetts town" }, { status: 404 });
  return Response.json(townStats(town));
}
