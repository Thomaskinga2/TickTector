import type { ScanResult } from "@/lib/types";
import { getJson } from "./http";

export function analyzeTickPhoto(file: File): Promise<ScanResult> {
  const form = new FormData();
  form.append("photo", file);
  return getJson("/api/scan", { method: "POST", body: form });
}
