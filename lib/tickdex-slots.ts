// Turns the flat list of catches (newest first) into the Tickdex grid: one row per species, one slot per stage.
import { DEX_SPECIES, TICK_STAGES, dexNumber, type NewCatch, type TickStage, type TickdexCatch } from "@/lib/tickdex";

export const UNKNOWN_SPECIES_ID = "unknown";

export type DexSlot = {
  key: string;
  number: number; // 1–9, or 0 for an unidentified tick
  speciesId: string;
  speciesName: string;
  stage: TickStage;
  catches: TickdexCatch[]; // newest first
};

export type DexRow = { speciesId: string; name: string; slots: DexSlot[] };

export type Dex = { rows: DexRow[]; unidentified: DexSlot[]; caughtSlots: number; totalCatches: number };

export function slotKey(speciesId: string, stage: TickStage): string {
  return `${speciesId}:${stage}`;
}

function toSlot(speciesId: string, speciesName: string, stage: TickStage, catches: TickdexCatch[]): DexSlot {
  return {
    key: slotKey(speciesId, stage),
    number: dexNumber(speciesId, stage),
    speciesId,
    speciesName,
    stage,
    catches: catches.filter((c) => c.speciesId === speciesId && c.stage === stage),
  };
}

export function buildDex(catches: TickdexCatch[]): Dex {
  const rows = DEX_SPECIES.map((species) => ({
    speciesId: species.id,
    name: species.name,
    slots: TICK_STAGES.map((stage) => toSlot(species.id, species.name, stage, catches)),
  }));
  const unidentified = TICK_STAGES.map((stage) => toSlot(UNKNOWN_SPECIES_ID, "Unidentified tick", stage, catches)).filter(
    (slot) => slot.catches.length > 0,
  );
  const caughtSlots = rows.flatMap((row) => row.slots).filter((slot) => slot.catches.length > 0).length;
  return { rows, unidentified, caughtSlots, totalCatches: catches.length };
}

export function findSlot(dex: Dex, key: string): DexSlot | undefined {
  return [...dex.rows.flatMap((row) => row.slots), ...dex.unidentified].find((slot) => slot.key === key);
}

// "No. 001"; unidentified ticks have no number.
export function formatDexNumber(n: number): string {
  return n > 0 ? `No. ${String(n).padStart(3, "0")}` : "No. ?";
}

export function firstCaught(slot: DexSlot): TickdexCatch | undefined {
  return slot.catches[slot.catches.length - 1];
}

export function newestPhoto(slot: DexSlot): string | undefined {
  return slot.catches.find((c) => c.photo)?.photo;
}

const STAGE_LABEL: Record<TickStage, string> = { larva: "Larva", nymph: "Nymph", adult: "Adult" };

export function stageLabel(stage: TickStage): string {
  return STAGE_LABEL[stage];
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// ?demo=1 sample set: several species, stages and repeats, plus one unidentified tick. Oldest first.
export const SAMPLE_CATCHES: NewCatch[] = [
  { speciesId: "deer-tick", speciesName: "Deer tick (blacklegged tick)", stage: "nymph", engorgement: "flat", townId: "amherst", isBeanDemo: true },
  { speciesId: "dog-tick", speciesName: "American dog tick", stage: "adult", engorgement: "partly fed", townId: "amherst", isBeanDemo: true },
  { speciesId: "deer-tick", speciesName: "Deer tick (blacklegged tick)", stage: "adult", engorgement: "engorged", townId: "amherst", isBeanDemo: true },
  { speciesId: UNKNOWN_SPECIES_ID, speciesName: "Unidentified tick", stage: "nymph", engorgement: "flat", isBeanDemo: true },
  { speciesId: "lone-star-tick", speciesName: "Lone star tick", stage: "larva", engorgement: "flat", townId: "amherst", isBeanDemo: true },
  { speciesId: "deer-tick", speciesName: "Deer tick (blacklegged tick)", stage: "nymph", engorgement: "partly fed", townId: "amherst", isBeanDemo: true },
  { speciesId: "deer-tick", speciesName: "Deer tick (blacklegged tick)", stage: "nymph", engorgement: "engorged", isBeanDemo: true },
];
