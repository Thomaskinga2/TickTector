// Real tick facts for /api/species and /api/alerts. Every fact cites its file in data/.
import type { ActionAlert, RiskLevel, TickSpecies } from "@/lib/types";

export const DEER_TICK: TickSpecies = {
  id: "deer-tick",
  commonName: "Black-legged tick (deer tick)",
  scientificName: "Ixodes scapularis",
  danger: "high",
  // data/amherst/pdf-text/insect-repellent-guide-2025.txt; B. miyamotoi: data/massgov/text/tickborne-disease-surveillance-report-2025.txt
  diseases: ["Lyme disease", "Anaplasmosis", "Babesiosis", "Ehrlichiosis", "Powassan virus", "Borrelia miyamotoi"],
  // data/massgov/text/tickborne-disease-surveillance-report-2025.txt (nymphs spring and summer; adults any time above freezing)
  season: "Year-round above freezing. Young ticks peak in late spring and summer.",
};

export const DOG_TICK: TickSpecies = {
  id: "dog-tick",
  commonName: "American dog tick",
  scientificName: "Dermacentor variabilis",
  danger: "moderate",
  // data/amherst/pdf-text/insect-repellent-guide-2025.txt, data/amherst/pdf-text/all-about-ticks-flyer.txt
  diseases: ["Tularemia", "Rocky Mountain spotted fever"],
  // data/amherst/ticks-page.md ("most active during warmer month's (April-September)")
  season: "Most active April–September",
};

export const LONE_STAR_TICK: TickSpecies = {
  id: "lone-star-tick",
  commonName: "Lone star tick",
  scientificName: "Amblyomma americanum",
  danger: "moderate",
  // data/amherst/pdf-text/insect-repellent-guide-2025.txt; alpha-gal: data/amherst/ticks-page.md
  diseases: ["Alpha-gal syndrome (red meat allergy)", "Ehrlichiosis", "Tularemia", "Heartland virus"],
  // data/amherst/ticks-page.md ("most active during warmer month's (April-September)")
  season: "Most active April–September",
};

// data/amherst/ticks-page.md: lone star ticks "identified on the Cape and Islands",
// "especially on the Cape and Martha's Vineyard", "recent reports ... in Berkshire County".
const LONE_STAR_COUNTIES = ["Barnstable", "Dukes", "Nantucket", "Berkshire"];

export function speciesFor(county: string): TickSpecies[] {
  return LONE_STAR_COUNTIES.includes(county) ? [DEER_TICK, DOG_TICK, LONE_STAR_TICK] : [DEER_TICK, DOG_TICK];
}

// All steps: data/amherst/ticks-page.md (PREVENTION TIPS and TICK REMOVAL).
const PREVENTION: Record<RiskLevel, string[]> = {
  low: [
    "Stick to the center of trails when hiking.",
    "After time outdoors, check yourself, your children and your pets for ticks: scalp, behind the ears, underarms, groin and behind the knees.",
  ],
  moderate: [
    "Stick to the center of trails when hiking.",
    "Use an EPA-approved repellent with DEET, picaridin or permethrin on exposed skin and clothing.",
    "Wear long sleeves, long pants tucked into socks and closed-toe shoes. Light colors make ticks easier to spot.",
    "Do a full tick check after every outing. Ticks can be as small as a poppy seed, so use a mirror or ask for help.",
  ],
  high: [
    "Use an EPA-approved repellent with DEET or picaridin on skin, and treat clothing, gear and footwear with permethrin.",
    "Wear long sleeves, long pants tucked into socks and closed-toe shoes. Light colors make ticks easier to spot.",
    "Stick to the center of trails and avoid tall grass and brush.",
    "Do a full tick check after every outing: scalp, behind the ears, underarms, groin and behind the knees.",
    "Check your pets and ask your vet about tick prevention products.",
  ],
};

const TITLES: Record<RiskLevel, string> = {
  low: "Stay aware outdoors",
  moderate: "Protect yourself before you go out",
  high: "High risk: take every precaution",
};

const REMOVAL: string[] = [
  "Don't panic. Lyme bacteria can take up to 48 hours to pass into your body, so remove ticks as soon as you find them.",
  "Grip the tick with fine-point tweezers as close to the skin as possible and pull straight out with steady pressure. Don't use kerosene, petroleum jelly, nail polish or a hot match.",
  "Note the date and where on your body the tick was. You may want to save the tick for identification.",
  "Tell your doctor after a deer tick bite, or if you get a rash, fever, headache, fatigue or aching muscles.",
];

export function alertsFor(level: RiskLevel): ActionAlert[] {
  return [
    { id: `prevent-${level}`, level, title: TITLES[level], steps: PREVENTION[level] },
    { id: `remove-${level}`, level, title: "If you find a tick", steps: REMOVAL },
  ];
}
