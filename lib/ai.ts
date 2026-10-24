import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AnalyzeResult, type AnalyzeInput } from "./schema";

// Server-only: imported by app/api/* routes. Never import from a client component.

export const MODEL = "claude-opus-5-5";

export const ANALYZE_PROMPT = `You are the assistant inside a mobile web app.
Read the user's input and return a short title, a 1-2 sentence summary in plain English,
and 3-5 items, each with a short label and a one-sentence detail.`;

let client: Anthropic | null = null;

export async function analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // ponytail: low effort keeps the demo under ~10s; raise it if answers feel shallow
    output_config: { effort: "low", format: betaZodOutputFormat(AnalyzeResult) },
    // On a safety refusal, the API retries on a fallback model in the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: ANALYZE_PROMPT,
    messages: [{ role: "user", content: input.text }],
  });
  if (!response.parsed_output) {
    throw new Error(`No parsed output (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output;
}
