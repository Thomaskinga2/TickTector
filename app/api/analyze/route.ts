import { analyze } from "@/lib/ai";
import { DEMO_RESULT } from "@/lib/demo-data";
import { AnalyzeInput, type AnalyzeResponse } from "@/lib/schema";

export const maxDuration = 60;

export async function POST(request: Request) {
  const parsed = AnalyzeInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const demo = (): Response => Response.json({ result: DEMO_RESULT, demo: true } satisfies AnalyzeResponse);

  if (process.env.DEMO_MODE === "1" || !process.env.ANTHROPIC_API_KEY) return demo();

  try {
    const result = await analyze(parsed.data);
    return Response.json({ result, demo: false } satisfies AnalyzeResponse);
  } catch (error) {
    console.error("analyze failed, serving demo fallback:", error);
    return demo();
  }
}
