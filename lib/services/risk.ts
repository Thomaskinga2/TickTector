import type { ActionAlert, RiskLevel, TickSpecies, WeeklyRisk } from "@/lib/types";
import { getJson } from "./http";

export function getWeeklyRisk(townId: string): Promise<WeeklyRisk> {
  return getJson(`/api/risk?town=${encodeURIComponent(townId)}`);
}

export function getSpecies(townId: string): Promise<TickSpecies[]> {
  return getJson(`/api/species?town=${encodeURIComponent(townId)}`);
}

export function getAlerts(level: RiskLevel): Promise<ActionAlert[]> {
  return getJson(`/api/alerts?level=${level}`);
}
