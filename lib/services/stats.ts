import type { StatewideStats, TownStats } from "@/lib/types";
import { getJson } from "./http";

export function getTownStats(townId: string): Promise<TownStats> {
  return getJson(`/api/stats?town=${encodeURIComponent(townId)}`);
}

export function getStatewideStats(): Promise<StatewideStats> {
  return getJson("/api/stats/statewide");
}
