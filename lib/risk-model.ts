// Server-only: turns the bundled DPH county data into risk levels and chart data.
// Data comes from data/scripts/build_app_data.py; rerun it when data/massgov/ changes.

import countyStats from "@/lib/data/county-stats.json";
import statewide from "@/lib/data/statewide.json";
import towns from "@/lib/data/towns.json";
import { LONE_STAR_TICK, speciesFor } from "@/lib/tick-facts";
import type { DiseaseKey, HeatmapPoint, RiskLevel, StatewideStats, Town, TownStats, WeeklyRisk } from "@/lib/types";

// Cases per 100k (2025, Lyme + babesiosis + anaplasmosis). Tune here only.
export const CUTOFFS = { high: 250, moderate: 100 };
const WINTER_MONTHS = [11, 0, 1]; // Dec–Feb: ticks least active, level drops one step
const DISEASES: DiseaseKey[] = ["lyme", "babesiosis", "hga"];

type CountyRow = (typeof countyStats)[keyof typeof countyStats];
const STATS = countyStats as Record<string, CountyRow>;
const STATE = STATS["State Total"];
const MAX_SCORE = Math.max(...Object.entries(STATS).filter(([k]) => k !== "State Total").map(([, s]) => s.score));

export const TOWNS: Town[] = towns;
export const findTown = (id: string) => TOWNS.find((t) => t.id === id);
// "Amherst", "north adams" or "north-adams" -> the town with its county (MassGIS). undefined = not one of the 351 MA towns.
export const townFromName = (name: string) => {
  const q = name.trim().toLowerCase();
  return TOWNS.find((t) => t.name.toLowerCase() === q || t.id === q.replace(/\s+/g, "-"));
};

// Dukes and Nantucket share one row in the DPH tables.
export const statsKey = (county: string) => (county === "Dukes" || county === "Nantucket" ? "Dukes & Nantucket" : county);

const isWinter = (date: Date) => WINTER_MONTHS.includes(date.getMonth());

export function levelFor(score: number, date = new Date()): RiskLevel {
  const base = score >= CUTOFFS.high ? 2 : score >= CUTOFFS.moderate ? 1 : 0;
  const levels: RiskLevel[] = ["low", "moderate", "high"];
  return levels[Math.max(0, base - (isWinter(date) ? 1 : 0))];
}

function countyLabel(key: string) {
  return key === "Dukes & Nantucket" ? "Dukes and Nantucket counties" : `${key} County`;
}

function reasonFor(key: string, date: Date) {
  const ratio = STATS[key].score / STATE.score;
  const compared = ratio >= 2 ? "well above" : ratio >= 1.25 ? "above" : ratio <= 0.8 ? "below" : "about";
  const winter = isWinter(date) ? " Ticks are less active in winter, so the risk is one level lower this week." : "";
  return `In 2025, the tick-borne disease rate in ${countyLabel(key)} was ${compared} the state average.${winter}`;
}

const DISEASE_NAME: Record<DiseaseKey, string> = { lyme: "Lyme disease", babesiosis: "babesiosis", hga: "anaplasmosis" };
const RANK = ["the highest", "the second-highest", "the third-highest"];
const COUNTIES = Object.values(STATS).filter((s) => s.county !== "State Total");

// One short fact per county: lone star ticks (lib/tick-facts.ts), else the county's best DPH ranking, else a statewide fact.
function tickFact(county: string) {
  if (speciesFor(county).includes(LONE_STAR_TICK))
    return "Lone star ticks have been found here. Their bite can cause alpha-gal syndrome, an allergy to red meat.";
  const key = statsKey(county);
  const best = DISEASES.map((d) => ({ d, rank: [...COUNTIES].sort((a, b) => b.rates[d] - a.rates[d]).findIndex((s) => s.county === key) })).sort(
    (a, b) => a.rank - b.rank,
  )[0];
  if (best.rank < RANK.length) return `${countyLabel(key)} has ${RANK[best.rank]} ${DISEASE_NAME[best.d]} rate in Massachusetts. Deer ticks spread it.`;
  // data/amherst/ticks-page.md: "The two most common types of ticks found in Massachusetts are the Black-legged ticks ... and the Dog Tick"
  return "Deer ticks and dog ticks are the two most common ticks in Massachusetts. Deer ticks are the ones that carry Lyme disease.";
}

function mondayOf(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function weeklyRisk(town: Town, date = new Date()): WeeklyRisk {
  const key = statsKey(town.county);
  return { townId: town.id, weekOf: mondayOf(date), level: levelFor(STATS[key].score, date), reason: reasonFor(key, date) };
}

export function heatmap(date = new Date()): HeatmapPoint[] {
  return TOWNS.map((t) => {
    const score = STATS[statsKey(t.county)].score;
    return { townId: t.id, name: t.name, lat: t.lat, lng: t.lng, county: t.county, value: score / MAX_SCORE, score, level: levelFor(score, date) };
  });
}

const AMHERST_NOTE = {
  text: "In 2025, more than a quarter of the cases in the region were in Amherst residents.",
  source: "Amherst Public Health",
  url: "https://www.amherstma.gov/3784/Ticks",
};

export function townStats(town: Town, date = new Date()): TownStats {
  const key = statsKey(town.county);
  const s = STATS[key];
  return {
    town,
    county: key,
    score: s.score,
    stateScore: STATE.score,
    level: levelFor(s.score, date),
    rates: DISEASES.map((d) => ({ disease: d, county: s.rates[d], state: STATE.rates[d] })),
    trend: s.trend,
    er: STATE.er.map((e) => ({ period: e.period, state: e.rate, county: s.er.find((c) => c.period === e.period)?.rate ?? null })),
    note: town.id === "amherst" ? AMHERST_NOTE : undefined,
    fact: tickFact(town.county),
  };
}

export function statewideStats(date = new Date()): StatewideStats {
  const counties = Object.values(STATS)
    .filter((s) => s.county !== "State Total")
    .map((s) => {
      const largest = TOWNS.filter((t) => statsKey(t.county) === s.county).sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
      return { county: s.county, score: s.score, level: levelFor(s.score, date), townId: largest.id };
    })
    .sort((a, b) => b.score - a.score);
  return { years: statewide, counties };
}
