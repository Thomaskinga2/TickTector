// Sends the frozen frame through the real pipeline (analyzeTickPhoto -> POST /api/scan).
// If the call fails or takes longer than SCAN_TIMEOUT_MS, the scan plays on with the sample result.
import { SCAN_RESULT } from "@/lib/mock-data";
import { analyzeTickPhoto } from "@/lib/services/scan";
import { canvasToFile } from "./photo";
import type { ScanResult } from "@/lib/types";

export const SCAN_TIMEOUT_MS = 30_000;

export type Identified = { result: ScanResult; offline: boolean };

export async function identifyPhoto(file: File): Promise<Identified> {
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error("The scan took too long")), SCAN_TIMEOUT_MS);
  });
  try {
    const result = await Promise.race([analyzeTickPhoto(file), timeout]);
    return { result, offline: false };
  } catch {
    return { result: SCAN_RESULT, offline: true };
  } finally {
    window.clearTimeout(timer);
  }
}

// The frozen frame as a JPEG, through identifyPhoto; never rejects
export function identifyFrame(frame: HTMLCanvasElement): Promise<Identified> {
  return canvasToFile(frame)
    .then(identifyPhoto)
    .catch(() => ({ result: SCAN_RESULT, offline: true }));
}
