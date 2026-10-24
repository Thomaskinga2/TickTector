import type { ActionAlert, TickFact, TickSpecies } from "./types";

// Fixed, cited content the API serves: tick species and prevention steps (Mass. DPH and CDC), each with its sources.
// Nothing here is invented; towns and risk come from real datasets and live APIs (lib/data/, lib/providers/).

// DEMO_MODE=1 keeps every API route offline (no live forecast), for a live demo on bad Wi-Fi.
export const isDemoMode = () => process.env.DEMO_MODE === "1";

// Sunday that starts the current week in Massachusetts (YYYY-MM-DD), as on US calendars (Sunday to Saturday).
// Risk rows get it at request time so "week of" is never stale.
export function currentWeekOf(now = new Date()): string {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}

// Citations. Checked against each page on 2026-10-24.
const DPH_PREVENTION = { name: "Mass. DPH: Tick-borne disease prevention", url: "https://www.mass.gov/info-details/tick-borne-disease-prevention" };
const DPH_LYME = { name: "Mass. DPH: Lyme disease", url: "https://www.mass.gov/info-details/lyme-disease" };
const DPH_RMSF = { name: "Mass. DPH: Rocky Mountain spotted fever", url: "https://www.mass.gov/info-details/rocky-mountain-spotted-fever" };
const DPH_ALPHA_GAL = { name: "Mass. DPH: Alpha-gal syndrome", url: "https://www.mass.gov/info-details/alpha-gal-syndrome-ags" };
const CDC_WHERE = { name: "CDC: Where ticks live", url: "https://www.cdc.gov/ticks/about/where-ticks-live.html" };
const CDC_PREVENTION = { name: "CDC: Preventing tick bites", url: "https://www.cdc.gov/ticks/prevention/index.html" };
const DPH_TULAREMIA = { name: "Mass. DPH: Tularemia", url: "https://www.mass.gov/info-details/tularemia" };
const DPH_REPORT_AUG_2026 = {
  name: "Mass. DPH, Tick Exposure and Tick-borne Disease Syndromic Surveillance Report, August 2026, Figure 3",
  url: "https://www.mass.gov/doc/tick-exposure-and-tickborne-disease-syndromic-surveillance-report-august-2026/download",
};

const CDC_POWASSAN = { name: "CDC: About Powassan virus", url: "https://www.cdc.gov/powassan/about/index.html" };
const CDC_EID_POWV = {
  name: "CDC, Emerging Infectious Diseases: Powassan virus lineage I in ticks, New York (2023)",
  url: "https://wwwnc.cdc.gov/eid/article/29/2/22-0410_article",
};

// Real photos, cropped square on the tick (public/ticks/). Each license allows reuse with this credit.
function photo(id: string, alt: string, credit: string, file: string) {
  return { src: `/ticks/${id}.jpg`, width: 1080, height: 1080, alt, credit: { name: credit, url: `https://commons.wikimedia.org/wiki/File:${file}` } };
}

// Wording follows the cited pages; nothing is added that they don't say.
export const SPECIES: TickSpecies[] = [
  {
    id: "deer-tick",
    commonName: "Blacklegged tick (deer tick)",
    scientificName: "Ixodes scapularis",
    diseases: ["Lyme disease", "Babesiosis", "Anaplasmosis", "Borrelia miyamotoi", "Powassan virus"],
    season: "Nymphs May–July, adults spring and fall; any day above freezing",
    photo: photo("deer-tick", "An adult female deer tick on a leaf: orange-red body, black shield and black legs.", "Photo: USDA / Scott Bauer, public domain", "Adult_deer_tick.jpg"),
    sources: [DPH_PREVENTION, DPH_LYME, CDC_WHERE],
  },
  {
    id: "dog-tick",
    commonName: "American dog tick",
    scientificName: "Dermacentor variabilis",
    diseases: ["Rocky Mountain spotted fever", "Tularemia"],
    season: "Spring and summer (adults bite)",
    photo: photo("dog-tick", "An adult female American dog tick, head on: dark red-brown body with a cream-marbled shield.", "Photo: Ryan Hodnett, CC BY-SA 4.0 (cropped)", "American_Dog_Tick_(Dermacentor_variabilis)_-_Kitchener,_Ontario_2019-06-15_(08).jpg"),
    sources: [DPH_PREVENTION, DPH_RMSF, CDC_WHERE],
  },
  {
    id: "lone-star-tick",
    commonName: "Lone star tick",
    scientificName: "Amblyomma americanum",
    diseases: ["Ehrlichiosis", "Tularemia", "STARI", "Alpha-gal syndrome (red meat allergy)"],
    season: "Spring to fall; any day above freezing",
    note: "Rarely spreads infections in Massachusetts so far.",
    photo: photo("lone-star-tick", "An adult female lone star tick on a blade of grass: red-brown body with one white spot on its back.", "Photo: CDC / James Gathany, public domain", "Amblyomma_americanum_tick_2.jpg"),
    sources: [DPH_PREVENTION, DPH_ALPHA_GAL, CDC_WHERE],
  },
  {
    id: "woodchuck-tick",
    commonName: "Woodchuck tick (groundhog tick)",
    scientificName: "Ixodes cookei",
    diseases: ["Powassan virus"],
    season: "Late spring to mid-fall",
    note: "Bites people less often than the deer tick.",
    photo: photo("woodchuck-tick", "An adult female woodchuck tick after feeding: small dark-brown head and legs, swollen grey body.", "Photo: adamfritz (iNaturalist), CC BY 4.0", "Ixodes_cookei.jpg"),
    sources: [CDC_POWASSAN, CDC_EID_POWV],
  },
];

// Where each species is found, by county. Deer and dog ticks are found throughout Massachusetts; lone star ticks are
// established on Cape Cod, Martha's Vineyard and Nantucket (Mass. DPH prevention and alpha-gal pages).
export const SPECIES_RANGE: Record<string, "statewide" | string[]> = {
  "deer-tick": "statewide",
  "dog-tick": "statewide",
  "lone-star-tick": ["Barnstable", "Dukes", "Nantucket"],
  // Mass. DPH's surveillance reports name it as a Powassan carrier here but publish no county range, so it's listed everywhere.
  "woodchuck-tick": "statewide",
};

export const ALERTS: ActionAlert[] = [
  {
    id: "alert-low",
    level: "low",
    title: "Stay aware outdoors",
    steps: [
      "Check yourself, your kids and your pets for ticks after being outside, even in your yard.",
      "Walk in the middle of trails.",
    ],
    sources: [DPH_PREVENTION, CDC_PREVENTION],
  },
  {
    id: "alert-moderate",
    level: "moderate",
    title: "Protect yourself before you go out",
    steps: [
      "Use EPA-registered repellent (DEET, picaridin or IR3535). No DEET on babies under 2 months; 30% or less for kids.",
      "Wear long sleeves and light-colored pants tucked into socks.",
      "Do a full tick check when you come inside: hair, ears, underarms, waist, behind the knees.",
    ],
    sources: [DPH_LYME, CDC_PREVENTION],
  },
  {
    id: "alert-high",
    level: "high",
    title: "High risk: take every precaution",
    steps: [
      "Use EPA-registered repellent (DEET, picaridin or IR3535) on skin.",
      "Treat clothes, shoes and gear with 0.5% permethrin. Never on skin.",
      "Skip brush, tall grass and leaf litter; stay off trail edges.",
      "Shower within 2 hours of coming inside.",
      "Dry clothes on high heat for 10 minutes to kill ticks.",
    ],
    sources: [DPH_LYME, CDC_PREVENTION],
  },
];

// "Did you know?" facts. Each one restates a single sentence of its source; lib/providers/facts.ts adds live ones
// computed from the newest DPH report.
export const FACTS: TickFact[] = [
  { id: "no-jump", text: "Ticks can't fly or jump.", source: DPH_PREVENTION },
  {
    id: "seed-sizes",
    text: "A young deer tick (nymph) is the size of a poppy seed. An adult is the size of a sesame seed.",
    source: DPH_PREVENTION,
  },
  { id: "dog-tick-size", text: "An adult dog tick is about the size of a watermelon seed.", source: DPH_PREVENTION },
  {
    id: "lyme-24h",
    text: "A deer tick usually has to stay attached for at least 24 hours before it can spread Lyme disease.",
    source: DPH_LYME,
  },
  { id: "many-germs", text: "One deer tick can spread more than one kind of germ in a single bite.", source: DPH_LYME },
  {
    id: "rmsf-fast",
    text: "Unlike most tick-borne diseases, the germ behind Rocky Mountain spotted fever often spreads within 24 hours of a tick attaching.",
    source: DPH_RMSF,
  },
  {
    id: "alpha-gal",
    text: "A lone star tick bite can make some people allergic to red meat. It's called alpha-gal syndrome.",
    source: DPH_ALPHA_GAL,
  },
  {
    id: "vineyard-tularemia",
    text: "Tularemia has turned up on Martha's Vineyard every year since 2000, and there it's most often caught by breathing in the germ while landscaping, not from a bite.",
    source: DPH_TULAREMIA,
  },
  {
    id: "backyard",
    text: "Ticks like shady, damp, brushy, wooded or grassy places, and that includes your own backyard.",
    source: DPH_PREVENTION,
  },
  {
    id: "no-matches",
    text: "Kerosene, petroleum jelly, nail polish or a hot match won't get a tick off safely. Fine-point tweezers, pulled straight out, will.",
    source: DPH_PREVENTION,
  },
  {
    id: "who-gets-sick",
    text: "In Massachusetts ERs, children ages 5–14 and older adults are diagnosed with tick-borne diseases more often than other ages.",
    source: DPH_REPORT_AUG_2026,
  },
];
