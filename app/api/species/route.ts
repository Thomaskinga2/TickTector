import type { NextRequest } from "next/server";
import { SPECIES, SPECIES_RANGE } from "@/lib/mock-data";
import { findTown } from "@/lib/providers/risk";

// GET /api/species?town=amherst -> TickSpecies[]
export async function GET(request: NextRequest) {
  const townId = request.nextUrl.searchParams.get("town");
  const town = findTown(townId ?? "");
  if (!town) return Response.json({ error: "That isn't a Massachusetts city or town" }, { status: 404 });
  const found = SPECIES.filter((s) => {
    const range = SPECIES_RANGE[s.id] ?? "statewide";
    return range === "statewide" || range.includes(town.county);
  });
  return Response.json(found);
}
