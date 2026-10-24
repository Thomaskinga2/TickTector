import type { ActionAlert, HeatmapPoint, ScanResult, StatewideStats, TickSpecies, Town, TownStats, Weather, WeeklyRisk } from "./types";

// Mock data, served when DEMO_MODE=1. Real data lives in lib/data/ (built from data/massgov/).

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
  { townId: "amherst", name: "Amherst", county: "Hampshire", lat: 42.3732, lng: -72.5199, value: 0.85, score: 445, level: "high" },
  { townId: "northampton", name: "Northampton", county: "Hampshire", lat: 42.3251, lng: -72.6412, value: 0.8, score: 418, level: "high" },
  { townId: "pittsfield", name: "Pittsfield", county: "Berkshire", lat: 42.4501, lng: -73.2454, value: 0.7, score: 366, level: "high" },
  { townId: "springfield", name: "Springfield", county: "Hampden", lat: 42.1015, lng: -72.5898, value: 0.55, score: 288, level: "moderate" },
  { townId: "worcester", name: "Worcester", county: "Worcester", lat: 42.2626, lng: -71.8023, value: 0.35, score: 183, level: "low" },
  { townId: "lowell", name: "Lowell", county: "Middlesex", lat: 42.6334, lng: -71.3162, value: 0.45, score: 235, level: "moderate" },
  { townId: "framingham", name: "Framingham", county: "Middlesex", lat: 42.2793, lng: -71.4162, value: 0.5, score: 262, level: "moderate" },
  { townId: "boston", name: "Boston", county: "Suffolk", lat: 42.3601, lng: -71.0589, value: 0.4, score: 209, level: "moderate" },
  { townId: "plymouth", name: "Plymouth", county: "Plymouth", lat: 41.9584, lng: -70.6673, value: 0.75, score: 392, level: "high" },
  { townId: "barnstable", name: "Barnstable", county: "Barnstable", lat: 41.7003, lng: -70.3002, value: 0.9, score: 471, level: "high" },
];

export const TOWN_STATS: TownStats = {
  town: TOWNS[0],
  county: "Hampshire",
  score: 155,
  stateScore: 151,
  level: "moderate",
  rates: [
    { disease: "lyme", county: 105, state: 119 },
    { disease: "babesiosis", county: 9, state: 12 },
    { disease: "hga", county: 40, state: 21 },
  ],
  trend: [
    { year: 2023, lyme: 260, babesiosis: 19, hga: 38 },
    { year: 2024, lyme: 240, babesiosis: 15, hga: 55 },
    { year: 2025, lyme: 171, babesiosis: 15, hga: 65 },
  ],
  er: [
    { period: "2024", county: 9, state: 6 },
    { period: "2025", county: 10, state: 6 },
  ],
  note: { text: "Mock note for demo mode.", source: "Demo", url: "https://www.amherstma.gov/3784/Ticks" },
  fact: "Deer ticks and dog ticks are the two most common ticks in Massachusetts.",
};

export const WEATHER: Weather = {
  townId: "amherst",
  summary: "Today is humid and partly cloudy: 64°F with 72% humidity.",
  ticks: "Ticks can bite today. Adult ticks are active any time it's above freezing.",
};

export const STATEWIDE_STATS: StatewideStats = {
  years: [
    { year: "2024", partial: false, lyme: 8840, babesiosis: 788, hga: 1060, miyamotoi: 57, powassan: 11 },
    { year: "2025", partial: false, lyme: 8619, babesiosis: 881, hga: 1496, miyamotoi: 107, powassan: 12 },
  ],
  counties: [
    { county: "Barnstable", score: 523, level: "high", townId: "barnstable" },
    { county: "Hampshire", score: 155, level: "moderate", townId: "amherst" },
    { county: "Suffolk", score: 29, level: "low", townId: "boston" },
  ],
};

export const SCAN_RESULT: ScanResult = {
  species: "Deer tick (blacklegged tick)",
  confidence: 0.82,
  advice: "Remove it with fine-tipped tweezers, save it in a sealed bag, and watch for a rash or fever over the next 30 days.",
  stage: "adult",
  engorgement: "partly fed",
};
