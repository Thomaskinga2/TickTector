// Bite aftercare shown in the Tickdex detail sheet, for the newest catch in that slot.
// Follows CDC "What to do after a tick bite" guidance; general information, not medical advice.
import type { TickdexCatch } from "@/lib/tickdex";

export const WATCH_DAYS = 30;
// Preventive antibiotics for Lyme only help when started within this long after removal
export const PREVENTIVE_WINDOW_HOURS = 72;

export const CARE_STEPS: readonly string[] = [
  "If it is still attached, grip it with fine-tipped tweezers as close to the skin as you can and pull straight up, slowly and steadily. Do not twist or squeeze its body.",
  "If the mouthparts break off and stay in, try to lift them out with clean tweezers. If you can't, leave them alone and let the skin heal.",
  "Wash the bite and your hands with soap and water or rubbing alcohol.",
  "Keep the tick in a sealed bag or taped to paper (or in the freezer) in case a doctor wants to see it. Never crush it with your fingers.",
  "Skip nail polish, petroleum jelly or heat: they do not help and can delay removal.",
];

type SpeciesCare = { watchFor: string[]; note?: string };

const SPECIES_CARE: Record<string, SpeciesCare> = {
  "deer-tick": {
    watchFor: [
      "A red rash that grows over days, sometimes like a bull's-eye",
      "Fever, chills, headache, tiredness, or muscle and joint aches",
    ],
    note: "Deer ticks can carry Lyme disease. If it was attached for a day or more (it looked fed), call a doctor: one preventive antibiotic dose may be advised.",
  },
  "dog-tick": {
    watchFor: [
      "Fever and headache, especially in the first two weeks",
      "Small red spots starting on the wrists and ankles",
      "Weakness or trouble walking while it was attached (it usually passes once it is removed)",
    ],
    note: "Dog ticks can carry Rocky Mountain spotted fever, which needs treatment fast. See a doctor right away if fever starts.",
  },
  "lone-star-tick": {
    watchFor: [
      "A round red rash around the bite",
      "Fever, headache, tiredness or muscle aches",
      "Hives, swelling or stomach upset 3 to 6 hours after eating red meat",
    ],
    note: "Lone star ticks do not spread Lyme, but they can cause ehrlichiosis and a red meat allergy (alpha-gal syndrome).",
  },
};

const GENERAL_CARE: SpeciesCare = {
  watchFor: ["Any rash spreading from the bite", "Fever, chills, headache, tiredness, or aches"],
};

export function speciesCare(speciesId: string): SpeciesCare {
  return SPECIES_CARE[speciesId] ?? GENERAL_CARE;
}

// The last day to keep watching for symptoms after this catch
export function watchUntil(c: TickdexCatch): Date {
  return new Date(new Date(c.caughtAt).getTime() + WATCH_DAYS * 24 * 60 * 60 * 1000);
}

// Fed deer ticks within the preventive-antibiotic window get a "call a doctor now" banner
export function callDoctorSoon(c: TickdexCatch, now: Date = new Date()): boolean {
  const hours = (now.getTime() - new Date(c.caughtAt).getTime()) / (60 * 60 * 1000);
  return c.speciesId === "deer-tick" && c.engorgement !== "flat" && hours <= PREVENTIVE_WINDOW_HOURS;
}
