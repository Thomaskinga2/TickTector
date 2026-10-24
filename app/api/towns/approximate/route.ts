import { connection, type NextRequest } from "next/server";
import { townAt } from "@/lib/providers/geocoding";

// GET /api/towns/approximate -> Town
// The town around the visitor's IP address, from the city-level coordinates Vercel adds to every request
// (x-vercel-ip-latitude / x-vercel-ip-longitude). Home uses it until the browser shares a precise location.
// Nothing is stored. Off Vercel (local dev) the headers are missing and this answers 404.
export async function GET(request: NextRequest) {
  await connection(); // Per request: the answer depends on who's asking.
  const latHeader = request.headers.get("x-vercel-ip-latitude");
  const lngHeader = request.headers.get("x-vercel-ip-longitude");
  const lat = Number(latHeader);
  const lng = Number(lngHeader);
  if (!latHeader || !lngHeader || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "Your approximate location isn't available" }, { status: 404 });
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
