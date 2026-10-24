import type { NextRequest } from "next/server";
import { WEEKLY_RISK } from "@/lib/mock-data";

// GET /api/risk?town=amherst -> WeeklyRisk
export async function GET(request: NextRequest) {
  const townId = request.nextUrl.searchParams.get("town");
  // TODO: compute weekly risk from real data (season, weather, case counts) instead of mock rows.
  const risk = WEEKLY_RISK.find((r) => r.townId === townId);
  if (!risk) return Response.json({ error: "No risk data for this town yet" }, { status: 404 });
  return Response.json(risk);
}
