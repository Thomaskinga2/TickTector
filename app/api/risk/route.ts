import type { NextRequest } from "next/server";
import { findTown, getTownRisk } from "@/lib/providers/risk";

// GET /api/risk?town=amherst -> WeeklyRisk (with basis: the DPH and NWS numbers behind the level)
export async function GET(request: NextRequest) {
  const town = findTown(request.nextUrl.searchParams.get("town") ?? "");
  if (!town) return Response.json({ error: "That isn't a Massachusetts city or town" }, { status: 404 });
  return Response.json(await getTownRisk(town));
}
