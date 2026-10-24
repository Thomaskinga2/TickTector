import type { TickFact } from "@/lib/types";
import { getJson } from "./http";

export function getFacts(): Promise<TickFact[]> {
  return getJson("/api/facts");
}
