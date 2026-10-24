import type { NextRequest } from "next/server";
import { ALERTS, isDemoMode } from "@/lib/mock-data";
import { alertsFor } from "@/lib/tick-facts";
import { RISK_LEVELS, type RiskLevel } from "@/lib/types";

// GET /api/alerts?level=high -> ActionAlert[] (prevention for the level + tick removal steps)
export async function GET(request: NextRequest) {
  const level = request.nextUrl.searchParams.get("level") as RiskLevel;
  if (!RISK_LEVELS.includes(level)) {
    return Response.json({ error: "level must be low, moderate, or high" }, { status: 400 });
  }
  return Response.json(isDemoMode() ? ALERTS.filter((a) => a.level === level) : alertsFor(level));
}
