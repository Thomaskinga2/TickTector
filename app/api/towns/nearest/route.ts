import type { NextRequest } from "next/server";
import { townAt } from "@/lib/providers/geocoding";

// GET /api/towns/nearest?lat=42.37&lng=-72.52 -> Town
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!params.get("lat") || !params.get("lng") || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "lat and lng must be numbers" }, { status: 400 });
  }

  let town;
  try {
    town = await townAt(lat, lng);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
  if (!town) return Response.json({ error: "TickTector covers Massachusetts only" }, { status: 422 });
  return Response.json(town);
}
