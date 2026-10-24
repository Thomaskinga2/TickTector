// Sends the frozen frame through the real pipeline (analyzeTickPhoto -> POST /api/scan).
// /api/scan has no model yet (501), so result is null and the simulated tick stays the answer.
// No sample result stands in: offline only says the request never reached the server or timed out.
import { analyzeTickPhoto } from "@/lib/services/scan";
import { canvasToFile } from "./photo";
import type { ScanResult } from "@/lib/types";

export const SCAN_TIMEOUT_MS = 30_000;

export type Identified = { result: ScanResult | null; offline: boolean };

export async function identifyPhoto(file: File): Promise<Identified> {
  let timer = 0;
  let timedOut = false;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => {
      timedOut = true;
      reject(new Error("The scan took too long"));
    }, SCAN_TIMEOUT_MS);
  });
  try {
    const result = await Promise.race([analyzeTickPhoto(file), timeout]);
    return { result, offline: false };
  } catch (err) {
    // fetch rejects with a TypeError when the network is down; an error reply (the 501) means the server answered
    return { result: null, offline: timedOut || err instanceof TypeError };
  } finally {
    window.clearTimeout(timer);
  }
}

// The frozen frame as a JPEG, through identifyPhoto; never rejects
export function identifyFrame(frame: HTMLCanvasElement): Promise<Identified> {
  return canvasToFile(frame)
    .then(identifyPhoto)
    .catch(() => ({ result: null, offline: true }));
}
