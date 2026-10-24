import type { NextRequest } from "next/server";
import { ALERTS } from "@/lib/mock-data";
import { RISK_LEVELS, type RiskLevel } from "@/lib/types";

// GET /api/alerts?level=high -> ActionAlert[]
export async function GET(request: NextRequest) {
  const level = request.nextUrl.searchParams.get("level") as RiskLevel;
  if (!RISK_LEVELS.includes(level)) {
    return Response.json({ error: "level must be low, moderate, or high" }, { status: 400 });
  }
  // TODO: tailor steps to season and local species.
  return Response.json(ALERTS.filter((a) => a.level === level));
}
