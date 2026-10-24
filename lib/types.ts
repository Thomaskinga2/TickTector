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

export type ScanResult = {
  species: string | null;
  confidence: number;
  advice: string;
  stage?: "larva" | "nymph" | "adult";
  engorgement?: "flat" | "partly fed" | "engorged";
};

// Forum: a post carries its town and county only, never coordinates.
// "text": written by a person. "scan": made by createScanPost() from a tick scan.
export type ForumPostType = "text" | "scan";

export const SCAN_SPECIES = ["deer-tick", "dog-tick", "lone-star-tick", "asian-longhorned-tick", "other", "unknown"] as const;
export type ScanSpecies = (typeof SCAN_SPECIES)[number];
export const SCAN_SPECIES_NAME: Record<ScanSpecies, string> = {
  "deer-tick": "Blacklegged (deer) tick",
  "dog-tick": "American dog tick",
  "lone-star-tick": "Lone star tick",
  "asian-longhorned-tick": "Asian longhorned tick",
  other: "Other tick",
  unknown: "Unidentified tick",
};
export const SCAN_STAGES = ["larva", "nymph", "adult", "unknown"] as const;
export type ScanStage = (typeof SCAN_STAGES)[number];

export type ForumPost = {
  id: string;
  type: ForumPostType;
  townId: string;
  townName: string;
  county: string;
  title: string; // scan posts: the species name
  body: string; // scan posts: ""
  photos: string[]; // up to 4 image URLs (/api/forum/images/:id), EXIF removed
  tickSpecies?: string; // text posts: what the writer typed, if anything
  scan?: { species: ScanSpecies; confidence?: number; stage?: ScanStage; scannedAt: string };
  author: string;
  createdAt: string;
  commentCount: number;
  likeCount: number;
};

export type ForumComment = { id: string; postId: string; body: string; author: string; createdAt: string };

// A text post. Needs some text (title or body) or at least one photo.
export type NewPostInput = {
  townId: string;
  title: string;
  body: string;
  photos: File[]; // 0–4
  tickSpecies?: string;
  author: string;
};

// Scan → forum contract. The scan screen's Post button calls createScanPost() from lib/services/forum.ts:
//
//   import { createScanPost } from "@/lib/services/forum";
//   const town = await findNearestTown(lat, lng); // lib/services/towns.ts, or any MA town name
//   const post = await createScanPost({
//     photo: file, // the tick photo: File/Blob, or a data:/blob: URL
//     species: speciesIdFor(result.species) as ScanSpecies, // lib/tickdex.ts ids match
//     confidence: result.confidence,
//     stage: result.stage,
//     location: { town: town.name, lat, lng },
//     scannedAt: new Date().toISOString(),
//   });
//   router.push(`/forum/${post.id}`);
//
// It throws an Error whose message the button can show as-is, e.g. "Location is outside Massachusetts"
// or "Invalid image: use a JPEG, PNG or WebP photo". lat/lng are dropped before upload and never stored.
export type ScanPostInput = {
  photo: Blob | string;
  species: ScanSpecies;
  confidence?: number; // 0–1
  stage?: ScanStage;
  location: { town: string; lat?: number; lng?: number };
  scannedAt: string; // ISO date-time
  author?: string; // display name, "Anonymous" if left out
};
