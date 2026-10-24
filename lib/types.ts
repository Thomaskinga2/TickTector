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

export type ScanResult = {
  species: string | null;
  confidence: number;
  advice: string;
  stage?: "larva" | "nymph" | "adult";
  engorgement?: "flat" | "partly fed" | "engorged";
};

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
