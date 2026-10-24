import type { NextRequest } from "next/server";
import { isDemoMode, SPECIES } from "@/lib/mock-data";
import { findTown } from "@/lib/risk-model";
import { speciesFor } from "@/lib/tick-facts";

// GET /api/species?town=amherst -> TickSpecies[] (facts sourced in lib/tick-facts.ts)
export async function GET(request: NextRequest) {
  const townId = request.nextUrl.searchParams.get("town") ?? "";
  if (isDemoMode()) return Response.json(SPECIES);
  const town = findTown(townId);
  if (!town) return Response.json({ error: "We couldn't find that Massachusetts town" }, { status: 404 });
  return Response.json(speciesFor(town.county));
}
