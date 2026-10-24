// Server-only: turns the bundled DPH county data into risk levels and chart data.
// Data comes from data/scripts/build_app_data.py; rerun it when data/massgov/ changes.

import countyStats from "@/lib/data/county-stats.json";
import statewide from "@/lib/data/statewide.json";
import towns from "@/lib/data/towns.json";
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
  const score = STATS[key].score;
  const ratio = score / STATE.score;
  const compared =
    ratio >= 1.25 ? `${ratio.toFixed(1)} times the state average` : ratio <= 0.8 ? "below the state average" : "about the state average";
  const winter = isWinter(date) ? " Ticks are less active in winter, so the risk is one level lower this week." : "";
  return `${countyLabel(key)} had ${Math.round(score)} tick-borne disease cases per 100,000 people in 2025, ${compared}.${winter}`;
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
