import type { NextRequest } from "next/server";
import { SPECIES, TOWNS } from "@/lib/mock-data";

// GET /api/species?town=amherst -> TickSpecies[]
export async function GET(request: NextRequest) {
  const townId = request.nextUrl.searchParams.get("town");
  if (!TOWNS.some((t) => t.id === townId)) {
    return Response.json({ error: "No species data for this town yet" }, { status: 404 });
  }
  // TODO: filter species by what is actually found in this town.
  return Response.json(SPECIES);
}
