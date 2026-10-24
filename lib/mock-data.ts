import type { ActionAlert, HeatmapPoint, ScanResult, TickSpecies, Town, WeeklyRisk } from "./types";

// Mock data only. API routes read from here until real datasets land in data/.

// DEMO_MODE=1 forces every API route onto this mock data (safe for a live demo).
// When you replace a mock with real data in a route or provider, check this first.
export const isDemoMode = () => process.env.DEMO_MODE === "1";

export const TOWNS: Town[] = [
  { id: "amherst", name: "Amherst", county: "Hampshire", lat: 42.3732, lng: -72.5199 },
  { id: "boston", name: "Boston", county: "Suffolk", lat: 42.3601, lng: -71.0589 },
  { id: "worcester", name: "Worcester", county: "Worcester", lat: 42.2626, lng: -71.8023 },
];

export const WEEKLY_RISK: WeeklyRisk[] = [
  {
    townId: "amherst",
    weekOf: "2026-10-19",
    level: "high",
    reason: "Adult deer ticks are active in leaf litter during mild fall days.",
  },
  {
    townId: "boston",
    weekOf: "2026-10-19",
    level: "moderate",
    reason: "Ticks are active in parks and wooded edges; less so in dense urban areas.",
  },
  {
    townId: "worcester",
    weekOf: "2026-10-19",
    level: "low",
    reason: "Cooler nights this week have slowed tick activity.",
  },
];

export const SPECIES: TickSpecies[] = [
  {
    id: "deer-tick",
    commonName: "Deer tick (blacklegged tick)",
    scientificName: "Ixodes scapularis",
    danger: "high",
    diseases: ["Lyme disease", "Anaplasmosis", "Babesiosis"],
    season: "Year-round, peaks May–July and October–November",
  },
  {
    id: "dog-tick",
    commonName: "American dog tick",
    scientificName: "Dermacentor variabilis",
    danger: "moderate",
    diseases: ["Rocky Mountain spotted fever", "Tularemia"],
    season: "April–August",
  },
  {
    id: "lone-star-tick",
    commonName: "Lone star tick",
    scientificName: "Amblyomma americanum",
    danger: "moderate",
    diseases: ["Ehrlichiosis", "Alpha-gal syndrome"],
    season: "April–September",
  },
];

export const ALERTS: ActionAlert[] = [
  {
    id: "alert-low",
    level: "low",
    title: "Stay aware outdoors",
    steps: ["Check yourself for ticks after long walks.", "Stay on cleared trails when you can."],
  },
  {
    id: "alert-moderate",
    level: "moderate",
    title: "Protect yourself before you go out",
    steps: [
      "Use an EPA-registered repellent on skin and clothing.",
      "Wear long pants tucked into socks in grass and brush.",
      "Do a full-body tick check within 2 hours of coming inside.",
    ],
  },
  {
    id: "alert-high",
    level: "high",
    title: "High risk: take every precaution",
    steps: [
      "Treat clothing and gear with permethrin.",
      "Avoid leaf litter, tall grass, and brushy trail edges.",
      "Shower within 2 hours and check your scalp, ears, and behind the knees.",
      "Tumble-dry clothes on high heat for 10 minutes.",
    ],
  },
];

export const HEATMAP: HeatmapPoint[] = [
  { townId: "amherst", lat: 42.3732, lng: -72.5199, value: 0.85 },
  { townId: "northampton", lat: 42.3251, lng: -72.6412, value: 0.8 },
  { townId: "pittsfield", lat: 42.4501, lng: -73.2454, value: 0.7 },
  { townId: "springfield", lat: 42.1015, lng: -72.5898, value: 0.55 },
  { townId: "worcester", lat: 42.2626, lng: -71.8023, value: 0.35 },
  { townId: "lowell", lat: 42.6334, lng: -71.3162, value: 0.45 },
  { townId: "framingham", lat: 42.2793, lng: -71.4162, value: 0.5 },
  { townId: "boston", lat: 42.3601, lng: -71.0589, value: 0.4 },
  { townId: "plymouth", lat: 41.9584, lng: -70.6673, value: 0.75 },
  { townId: "barnstable", lat: 41.7003, lng: -70.3002, value: 0.9 },
];

export const SCAN_RESULT: ScanResult = {
  species: "Deer tick (blacklegged tick)",
  confidence: 0.82,
  advice: "Remove it with fine-tipped tweezers, save it in a sealed bag, and watch for a rash or fever over the next 30 days.",
  stage: "adult",
  engorgement: "partly fed",
};
