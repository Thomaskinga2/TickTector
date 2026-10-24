"use client";

import { useEffect, useState } from "react";
import { CameraCapture } from "@/components/camera-capture";
import { Page } from "@/components/page";
import { Disclaimer, slotStatus } from "@/components/states";
import { analyzeTickPhoto } from "@/lib/services/scan";
import type { ScanResult } from "@/lib/types";

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function scan(photo: File) {
    setFile(photo);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      setResult(await analyzeTickPhoto(photo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const status = slotStatus(
    { loading, error, onRetry: file ? () => scan(file) : undefined },
    !result,
    "Take a close, well-lit photo of the tick. A white background helps.",
  );

  return (
    <Page title="Scan a tick">
      <CameraCapture onCapture={scan} disabled={loading} label={file ? "Take another photo" : "Take a photo"} />

      {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize */}
      {preview && <img src={preview} alt="Your tick photo" className="max-h-64 w-full rounded-lg object-cover" />}

      {status ?? (
        result && (
          <section className="flex flex-col gap-2 rounded-lg border bg-card p-4">
            <p className="text-xl font-semibold">{result.species ?? "We couldn't identify a tick"}</p>
            {result.species && (
              <p className="text-sm text-muted-foreground">{Math.round(result.confidence * 100)}% match</p>
            )}
            <p>{result.advice}</p>
          </section>
        )
      )}

      <Disclaimer />
    </Page>
  );
}
