import { connection } from "next/server";
import { getFacts } from "@/lib/providers/facts";

// GET /api/facts -> TickFact[] (cited facts, a few computed from the newest Mass. DPH report)
export async function GET() {
  // Runs per request: the DPH-based facts follow the newest report.
  await connection();
  return Response.json(await getFacts());
}
