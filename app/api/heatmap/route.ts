import { HEATMAP } from "@/lib/mock-data";

// GET /api/heatmap -> HeatmapPoint[]
// Static mock, so Next prerenders it at build time.
export async function GET() {
  // TODO: compute per-town risk values (0..1) for all MA towns from data/.
  return Response.json(HEATMAP);
}
