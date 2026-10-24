import type { AnalyzeResult } from "./schema";

// Served when the AI call fails, times out, or no API key is set.
// Keep it realistic: this is what judges see if the network dies on stage.
export const DEMO_RESULT: AnalyzeResult = {
  title: "Sample result",
  summary: "This is cached demo output. Replace it with a real example once the idea is final.",
  items: [
    { label: "First point", detail: "Something useful the AI found." },
    { label: "Second point", detail: "Another useful finding." },
    { label: "Next step", detail: "One concrete action the user can take." },
  ],
};
