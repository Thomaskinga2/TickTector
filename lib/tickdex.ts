// Tickdex: the collection of ticks the player has caught, kept on this device only (localStorage).
// Shared contract: the Scan page writes catches, the Quest page reads them. Change it in both together.
import { z } from "zod";

export const TICK_STAGES = ["larva", "nymph", "adult"] as const;
export type TickStage = (typeof TICK_STAGES)[number];

// Dex order: each species has one slot per stage. Ids and names match SPECIES in lib/mock-data.ts.
export const DEX_SPECIES = [
  { id: "deer-tick", name: "Deer tick (blacklegged tick)" },
  { id: "dog-tick", name: "American dog tick" },
  { id: "lone-star-tick", name: "Lone star tick" },
  { id: "woodchuck-tick", name: "Woodchuck tick (groundhog tick)" },
] as const;
export const DEX_SIZE = DEX_SPECIES.length * TICK_STAGES.length;

const CatchSchema = z.object({
  id: z.string(),
  speciesId: z.string(), // a DEX_SPECIES id, or "unknown"
  speciesName: z.string(),
  stage: z.enum(TICK_STAGES),
  engorgement: z.enum(["flat", "partly fed", "engorged"]),
  caughtAt: z.string(), // ISO time
  photo: z.string().optional(), // small JPEG data URL, at most ~240 px on the long side
  townId: z.string().optional(),
  isBeanDemo: z.boolean(),
});
export type TickdexCatch = z.infer<typeof CatchSchema>;
export type NewCatch = Omit<TickdexCatch, "id" | "caughtAt">;
export type CatchOutcome = { entry: TickdexCatch; dexNumber: number; isNewSpecies: boolean; isNewSlot: boolean };

const STORAGE_KEY = "tiktector.tickdex.v1";
const CHANGE_EVENT = "tickdex:change";
const MAX_CATCHES = 200;
const PHOTOS_KEPT_WHEN_FULL = 10;
const NO_CATCHES: TickdexCatch[] = [];

// readCatches must return the same array until storage changes (useSyncExternalStore needs that).
let cachedRaw: string | null = null;
let cachedCatches: TickdexCatch[] = NO_CATCHES;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function speciesIdFor(name: string | null): string {
  const match = DEX_SPECIES.find((s) => s.name.toLowerCase() === name?.toLowerCase());
  return match?.id ?? "unknown";
}

// 1-based slot number: deer tick larva = 1, nymph = 2, adult = 3, then the next species. 0 = not in the dex.
export function dexNumber(speciesId: string, stage: TickStage): number {
  const s = DEX_SPECIES.findIndex((sp) => sp.id === speciesId);
  return s < 0 ? 0 : s * TICK_STAGES.length + TICK_STAGES.indexOf(stage) + 1;
}

export function readCatches(): TickdexCatch[] {
  let raw: string | null = null;
  try {
    raw = storage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedCatches;
  cachedRaw = raw;
  let parsed: unknown = [];
  try {
    parsed = raw ? JSON.parse(raw) : [];
  } catch {
    parsed = [];
  }
  cachedCatches = Array.isArray(parsed)
    ? parsed.flatMap((item) => {
        const result = CatchSchema.safeParse(item);
        return result.success ? [result.data] : [];
      })
    : NO_CATCHES;
  return cachedCatches;
}

export const getServerCatches = (): TickdexCatch[] => NO_CATCHES;

// Would this catch fill an empty slot? Scan asks before recording, to pick the full or quick catch.
export function peekCatch(speciesId: string, stage: TickStage): { isNewSpecies: boolean; isNewSlot: boolean } {
  const catches = readCatches();
  return {
    isNewSpecies: !catches.some((c) => c.speciesId === speciesId),
    isNewSlot: !catches.some((c) => c.speciesId === speciesId && c.stage === stage),
  };
}

function save(catches: TickdexCatch[]): boolean {
  const store = storage();
  if (!store) return false;
  const attempts = [catches, catches.map((c, i) => (i < PHOTOS_KEPT_WHEN_FULL ? c : { ...c, photo: undefined }))];
  for (const attempt of attempts) {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(attempt));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return true;
    } catch {
      // storage full or blocked: retry once with fewer photos
    }
  }
  return false;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// Records a catch, newest first. Returns what it filled; works (without saving) when storage is blocked.
export function addCatch(input: NewCatch): CatchOutcome {
  const { isNewSpecies, isNewSlot } = peekCatch(input.speciesId, input.stage);
  const entry: TickdexCatch = { ...input, id: newId(), caughtAt: new Date().toISOString() };
  save([entry, ...readCatches()].slice(0, MAX_CATCHES));
  return { entry, dexNumber: dexNumber(entry.speciesId, entry.stage), isNewSpecies, isNewSlot };
}

export function clearCatches(): void {
  save([]);
}

export function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
