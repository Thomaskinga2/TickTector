"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postAnalyze } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/schema";

// Working skeleton of the demo flow (input -> loading -> result / error).
// UI owner: restyle freely; keep calling postAnalyze().
export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setData(await postAnalyze({ text }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">App name</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something…"
          rows={4}
          className="rounded-md border p-3 text-base"
        />
        <Button type="submit" disabled={loading || !text.trim()}>
          {loading ? "Analyzing…" : "Analyze"}
        </Button>
      </form>

      {error && <p role="alert" className="text-red-600">{error}</p>}

      {data && (
        <section className="flex flex-col gap-3">
          {data.demo && <p className="text-sm text-zinc-500">Showing demo result</p>}
          <h2 className="text-xl font-semibold">{data.result.title}</h2>
          <p>{data.result.summary}</p>
          <ul className="flex flex-col gap-2">
            {data.result.items.map((item) => (
              <li key={item.label} className="rounded-md border p-3">
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
