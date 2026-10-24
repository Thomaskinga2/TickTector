// Shared contract between UI, services, and API routes. Change with the whole team.

export type Town = { id: string; name: string; county: string; lat: number; lng: number };

export type RiskLevel = "low" | "moderate" | "high";
export const RISK_LEVELS: RiskLevel[] = ["low", "moderate", "high"];

export type WeeklyRisk = { townId: string; weekOf: string; level: RiskLevel; reason: string; basis?: RiskBasis };

// A citation: who published it and where to read it.
export type Source = { name: string; url: string };

// Where a level comes from, shown as "Why this level". Every number is copied from its source, never estimated.
export type RiskBasis = {
  county: string; // DPH reporting group: a county name, or "Dukes & Nantucket"
  countyRate: number; // ER visits diagnosed as a tick-borne disease per 10,000 ER visits (Mass. DPH, Table 1)
  stateRate: number; // all counties' visits combined, computed from the same table (DPH doesn't print one)
  period: { from: string; to: string }; // "2026-01" .. "2026-08"
  // The DPH report used; live is false when mass.gov couldn't be read and the bundled copy was used.
  dph: { url: string; listUrl: string; live: boolean; checkedAt: string };
  // National Weather Service 7-day forecast; null when it couldn't be loaded. updated: the NWS update time.
  forecast: {
    highMin: number;
    highMax: number;
    daysAboveFreezing: number;
    days: number;
    place: string;
    updated: string;
    url: string;
  } | null;
};

// The same weekly risk for a whole county (DPH reports by county; towns inherit their county's level).
export type CountyRisk = Omit<WeeklyRisk, "townId"> & { county: string };

export type TickSpecies = {
  id: string;
  commonName: string;
  scientificName: string;
  diseases: string[];
  season: string;
  note?: string;
  // A real photo (public domain), credited in the page's sources line.
  photo?: { src: string; width: number; height: number; alt: string; credit: Source };
  sources: Source[];
};

// A "Did you know?" fact, always with the page it comes from.
export type TickFact = { id: string; text: string; source: Source };

export type ActionAlert = { id: string; level: RiskLevel; title: string; steps: string[]; sources: Source[] };

export type HeatmapPoint = { townId: string; lat: number; lng: number; value: number }; // value 0..1

export type ScanResult = { species: string | null; confidence: number; advice: string };

// Forum: a post carries its town and county only, never coordinates.
// "text": written by a person. "scan": made by createScanPost() from a tick scan.
export type ForumPostType = "text" | "scan";

export const SCAN_SPECIES = ["deer-tick", "dog-tick", "lone-star-tick", "woodchuck-tick", "asian-longhorned-tick", "other", "unknown"] as const;
export type ScanSpecies = (typeof SCAN_SPECIES)[number];
export const SCAN_SPECIES_NAME: Record<ScanSpecies, string> = {
  "deer-tick": "Blacklegged (deer) tick",
  "dog-tick": "American dog tick",
  "lone-star-tick": "Lone star tick",
  "woodchuck-tick": "Woodchuck tick",
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
  body: string; // scan posts: the caption, or ""
  photos: string[]; // up to 4 image URLs (/api/forum/photos/:id), EXIF removed
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
//     stage: entry.stage, // the Tickdex catch (lib/tickdex.ts TickStage)
//     location: { town: town.name, lat, lng },
//     scannedAt: new Date().toISOString(),
//     caption: "Found it on my sock after the hike", // optional
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
  caption?: string; // how the person feels about it, up to 500 characters, shown under the title
  author?: string; // display name, "Anonymous" if left out
};

// The weather in a town right now (Open-Meteo), for the town page's date line.
export type WeatherNow = { townId: string; tempF: number; sky: string; source: Source };
