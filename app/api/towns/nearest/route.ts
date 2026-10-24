import type { NextRequest } from "next/server";
import { TOWNS } from "@/lib/mock-data";
import { getGeocodingProvider } from "@/lib/providers/geocoding";
import type { Town } from "@/lib/types";

// GET /api/towns/nearest?lat=42.37&lng=-72.52 -> Town
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!params.get("lat") || !params.get("lng") || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "lat and lng must be numbers" }, { status: 400 });
  }

  let place;
  try {
    place = await getGeocodingProvider().reverseGeocode(lat, lng);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
  if (!place || place.state !== "MA") {
    return Response.json({ error: "TikTector covers Massachusetts only" }, { status: 422 });
  }

  // TODO: match against the full MA town list from data/ instead of the 3 mock towns.
  const known = TOWNS.find((t) => t.name.toLowerCase() === place.town.toLowerCase());
  const town: Town = known ?? {
    id: place.town.toLowerCase().replace(/\s+/g, "-"),
    name: place.town,
    county: place.county,
    lat,
    lng,
  };
  return Response.json(town);
}
