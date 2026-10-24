// Checks lib/tickdex.ts (the Tickdex store) against an in-memory localStorage.
// Run: node scripts/check-tickdex.mjs   (Node 24 loads the .ts module directly)
const mem = new Map();
const events = [];
let full = false;
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => {
    if (full && v.length > 300) throw new Error("QuotaExceededError");
    mem.set(k, v);
  },
};
globalThis.addEventListener = (t) => events.push("add:" + t);
globalThis.removeEventListener = (t) => events.push("rm:" + t);
globalThis.dispatchEvent = (e) => {
  events.push("fire:" + e.type);
  return true;
};

const T = await import("../lib/tickdex.ts");
const check = (name, ok) => {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) process.exitCode = 1;
};

check("empty store reads []", T.readCatches().length === 0);
check("returns the same array until storage changes", T.readCatches() === T.readCatches());
check("maps the scan's species name to a dex id", T.speciesIdFor("Deer tick (blacklegged tick)") === "deer-tick");
check("unknown and null names map to unknown", T.speciesIdFor("Bean") === "unknown" && T.speciesIdFor(null) === "unknown");
check(
  "numbers slots species by stage, 9 in all",
  T.dexNumber("deer-tick", "larva") === 1 &&
    T.dexNumber("deer-tick", "adult") === 3 &&
    T.dexNumber("lone-star-tick", "adult") === 9 &&
    T.dexNumber("unknown", "adult") === 0 &&
    T.DEX_SIZE === 9,
);

const base = { speciesId: "deer-tick", speciesName: "Deer tick (blacklegged tick)", stage: "adult", engorgement: "partly fed", isBeanDemo: true };
const a = T.addCatch(base);
check("first catch is a new species and a new slot, NO. 3", a.isNewSpecies && a.isNewSlot && a.dexNumber === 3);
check("recording fires the change event", events.includes("fire:tickdex:change"));
const b = T.addCatch(base);
check("a repeat catch fills nothing new", !b.isNewSpecies && !b.isNewSlot);
const c = T.addCatch({ ...base, stage: "nymph" });
check("a new stage of a known species is a new slot only", !c.isNewSpecies && c.isNewSlot && c.dexNumber === 2);
const list = T.readCatches();
check("keeps catches newest first", list.length === 3 && list[0].id === c.entry.id);
check("peekCatch agrees with what is stored", T.peekCatch("deer-tick", "larva").isNewSlot && !T.peekCatch("deer-tick", "adult").isNewSlot);

mem.set("tiktector.tickdex.v1", JSON.stringify([{ junk: true }, list[0]]));
check("drops invalid stored entries", T.readCatches().length === 1);
mem.set("tiktector.tickdex.v1", "not json");
check("reads corrupt storage as empty", T.readCatches().length === 0);

T.clearCatches();
full = true;
const d = T.addCatch({ ...base, photo: "x".repeat(1000) });
check("still returns the outcome when storage is full", d.isNewSlot && d.entry.photo?.length === 1000);

const unsubscribe = T.subscribe(() => {});
unsubscribe();
check(
  "subscribe adds and removes both listeners",
  ["add:tickdex:change", "add:storage", "rm:tickdex:change", "rm:storage"].every((e) => events.includes(e)),
);
