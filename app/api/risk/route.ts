import type { NextRequest } from "next/server";
import { isDemoMode, WEEKLY_RISK } from "@/lib/mock-data";
import { findTown, weeklyRisk } from "@/lib/risk-model";

// GET /api/risk?town=amherst -> WeeklyRisk (county data from MA DPH, see lib/risk-model.ts)
export async function GET(request: NextRequest) {
  const townId = request.nextUrl.searchParams.get("town") ?? "";
  if (isDemoMode()) {
    const risk = WEEKLY_RISK.find((r) => r.townId === townId);
    return risk ? Response.json(risk) : Response.json({ error: "No risk data for this town yet" }, { status: 404 });
  }
  const town = findTown(townId);
  if (!town) return Response.json({ error: "We couldn't find that Massachusetts town" }, { status: 404 });
  return Response.json(weeklyRisk(town));
}
