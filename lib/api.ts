import type { AnalyzeInput, AnalyzeResponse } from "./schema";

// Client-side helper: the only way UI code should call the backend.
export async function postAnalyze(input: AnalyzeInput): Promise<AnalyzeResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}
