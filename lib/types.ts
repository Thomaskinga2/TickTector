// Shared contract between UI, services, and API routes. Change with the whole team.

export type Town = { id: string; name: string; county: string; lat: number; lng: number; population?: number };

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

// value 0..1 = county score / highest county score. Every town gets its county's level.
export type HeatmapPoint = {
  townId: string;
  name: string;
  lat: number;
  lng: number;
  value: number;
  score: number; // county cases per 100k, 2025
  level: RiskLevel;
  county: string;
};

// Pre-projected outlines from public/geo/ma-towns.json (built by data/scripts/build_app_data.py).
export type MapShapes = {
  width: number;
  height: number;
  towns: { id: string; county: string; d: string }[];
  countyLines: string;
  counties: { name: string; statsKey: string; bbox: [number, number, number, number]; label: [number, number] }[];
};

// Stats come from MA DPH county data (data/massgov/), so towns share their county's numbers.
export type DiseaseKey = "lyme" | "babesiosis" | "hga";
export type CasesByDisease = Record<DiseaseKey, number | null>;

export type TownStats = {
  town: Town;
  county: string; // stats county: "Dukes & Nantucket" for both island counties
  score: number; // 2025 cases per 100k, Lyme + babesiosis + anaplasmosis
  stateScore: number;
  level: RiskLevel;
  rates: { disease: DiseaseKey; county: number | null; state: number | null }[]; // 2025, per 100k
  trend: ({ year: number } & CasesByDisease)[]; // county cases per year
  er: { period: string; county: number | null; state: number }[]; // ER visits per 10k visits
  note?: { text: string; source: string; url: string };
  fact: string; // one short tick fact for the county
};

// Today's weather for a town (Open-Meteo), already in words.
export type Weather = { townId: string; summary: string; ticks: string };

export type StatewideStats = {
  years: ({ year: string; partial: boolean; miyamotoi: number; powassan: number } & Record<DiseaseKey, number>)[];
  counties: { county: string; score: number; level: RiskLevel; townId: string }[]; // townId: largest town
};

export type ScanResult = { species: string | null; confidence: number; advice: string };

// Forum: lat/lng are always rounded to 2 decimals (~1 km) before saving or showing.
export type ForumPost = {
  id: string;
  townId: string;
  lat: number;
  lng: number;
  title: string;
  body: string;
  photoUrl?: string;
  tickSpecies?: string;
  author: string;
  createdAt: string;
  commentCount: number;
};

export type ForumComment = { id: string; postId: string; body: string; author: string; createdAt: string };

export type NewPostInput = {
  townId: string;
  lat: number;
  lng: number;
  title: string;
  body: string;
  photo?: File;
  tickSpecies?: string;
  author: string;
};
