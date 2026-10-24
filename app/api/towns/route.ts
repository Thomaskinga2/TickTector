import type { NextRequest } from "next/server";
import { getGeocodingProvider } from "@/lib/providers/geocoding";

// GET /api/towns?q=amh -> Town[]
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.length > 100) return Response.json({ error: "Search is too long" }, { status: 400 });

  try {
    // TODO: real provider may return non-MA places; filter to Massachusetts here.
    return Response.json(await getGeocodingProvider().searchPlaces(q));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
}
