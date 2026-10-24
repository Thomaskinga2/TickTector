// Shared contract between UI, services, and API routes. Change with the whole team.

export type Town = { id: string; name: string; county: string; lat: number; lng: number };

export type RiskLevel = "low" | "moderate" | "high";
export const RISK_LEVELS: RiskLevel[] = ["low", "moderate", "high"];

export type WeeklyRisk = { townId: string; weekOf: string; level: RiskLevel; reason: string };

export type TickSpecies = {
  id: string;
  commonName: string;
  scientificName: string;
  danger: RiskLevel;
  diseases: string[];
  season: string;
};

export type ActionAlert = { id: string; level: RiskLevel; title: string; steps: string[] };

export type HeatmapPoint = { townId: string; lat: number; lng: number; value: number }; // value 0..1

export type ScanResult = { species: string | null; confidence: number; advice: string };
