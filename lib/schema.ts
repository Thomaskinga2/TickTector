import { z } from "zod";

// THE CONTRACT between UI and backend. UI renders AnalyzeResult; backend must return it.
// Change these only after telling the whole team (see TEAM.md).
// Placeholder fields — reshape them once the idea is final.

export const AnalyzeInput = z.object({
  text: z.string().trim().min(1, "Please enter something").max(5000),
});
export type AnalyzeInput = z.infer<typeof AnalyzeInput>;

export const AnalyzeResult = z.object({
  title: z.string(),
  summary: z.string(),
  items: z.array(
    z.object({
      label: z.string(),
      detail: z.string(),
    }),
  ),
});
export type AnalyzeResult = z.infer<typeof AnalyzeResult>;

// What POST /api/analyze returns. demo=true means the fallback was served.
export type AnalyzeResponse = { result: AnalyzeResult; demo: boolean };
