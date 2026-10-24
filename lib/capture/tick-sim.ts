// The simulated tick for the demo scan: each try shuffles where it sits, which way it faces,
// its species, life stage and how fed it is. Names match the Tickdex (lib/tickdex.ts).
import { DEX_SPECIES, TICK_STAGES, type TickStage } from "@/lib/tickdex";

export const ENGORGEMENTS = ["flat", "partly fed", "engorged"] as const;
export type Engorgement = (typeof ENGORGEMENTS)[number];
export type SpeciesId = (typeof DEX_SPECIES)[number]["id"];

export type SimTick = {
  speciesId: SpeciesId;
  speciesName: string;
  stage: TickStage;
  engorgement: Engorgement;
  // where it sits in the viewfinder circle, as shares of the radius from the centre
  dx: number;
  dy: number;
  angle: number; // radians; 0 = head up
};

// Drawn size per stage, relative to an adult (the animation's tick at scale 1)
export const STAGE_SCALE: Record<TickStage, number> = { larva: 0.42, nymph: 0.62, adult: 1 };
export const FED_LEVEL: Record<Engorgement, number> = { flat: 0, "partly fed": 0.5, engorged: 1 };
// Keep the tick this far inside the circle, so the whole of it is in view
const MAX_OFFSET = 0.42;

const pick = <T,>(list: readonly T[], rand: () => number): T => list[Math.floor(rand() * list.length) % list.length];

// Repeatable shuffles for testing: /scan?tickSeed=7 (each try moves on to the next seed)
export function seededRandom(seed: number): () => number {
  let x = (seed * 2654435761) >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

export function shuffleTick(rand: () => number = Math.random): SimTick {
  const species = pick(DEX_SPECIES, rand);
  const r = MAX_OFFSET * Math.sqrt(rand());
  const a = rand() * Math.PI * 2;
  return {
    speciesId: species.id,
    speciesName: species.name,
    stage: pick(TICK_STAGES, rand),
    engorgement: pick(ENGORGEMENTS, rand),
    dx: Math.cos(a) * r,
    dy: Math.sin(a) * r,
    angle: (rand() - 0.5) * Math.PI * 2,
  };
}

// "American dog tick" -> "dog tick"; "Deer tick (blacklegged tick)" -> "deer tick"
export function shortName(name: string): string {
  return name
    .replace(/\s*\(.*\)\s*$/, "")
    .replace(/^American\s+/i, "")
    .trim()
    .toLowerCase();
}
