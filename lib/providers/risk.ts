import towns from "@/lib/data/ma-towns.json";
import { countyLabel, dphCounty } from "@/lib/counties";
import { currentWeekOf, isDemoMode } from "@/lib/mock-data";
import { DPH_COUNTIES, DPH_LIST_URL, getDphBaseline } from "@/lib/providers/dph";
import type { CountyRisk, RiskBasis, RiskLevel, Town, WeeklyRisk } from "@/lib/types";

// Server-only: called from app/api/risk/* and app/api/heatmap.
//
// Weekly risk from real data only, by a stated rule:
// 1. Baseline (Mass. DPH, newest monthly report, read live by lib/providers/dph.ts): the county's rate of ER visits
//    diagnosed as a tick-borne disease, against all counties combined. At least 1.5x is high, at least 0.75x is
//    moderate, anything lower is low.
// 2. This week (National Weather Service, live): Mass. DPH says ticks can be out any time temperatures are above
//    freezing. If no day in the 7-day forecast gets above 32°F, the level is low whatever the baseline.
// DPH reports no town-level numbers, so every town takes its county's level. scripts/build-*.mjs rebuild the data.

export const MA_TOWNS: Town[] = towns;

const HIGH_RATIO = 1.5;
const MODERATE_RATIO = 0.75;
const FREEZING_F = 32;
const TIMEOUT_MS = 8000;
const FORECAST_TTL_MS = 60 * 60 * 1000;
const NWS_HEADERS = { "User-Agent": "TickTector (github.com/Thomaskinga2/my-app)", Accept: "application/geo+json" };

export { dphCounty, DPH_COUNTIES };

export function findTown(id: string) {
  return MA_TOWNS.find((t) => t.id === id);
}

// One forecast point per county: the town closest to the middle of the county's towns.
function forecastTown(county: string) {
  const members = MA_TOWNS.filter((t) => dphCounty(t.county) === county);
  const lat = members.reduce((s, t) => s + t.lat, 0) / members.length;
  const lng = members.reduce((s, t) => s + t.lng, 0) / members.length;
  return members.reduce((best, t) => (Math.hypot(t.lat - lat, t.lng - lng) < Math.hypot(best.lat - lat, best.lng - lng) ? t : best));
}

type Forecast = NonNullable<RiskBasis["forecast"]>;
const forecastCache = new Map<string, { at: number; value: Promise<Forecast> }>();

async function nws<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: NWS_HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`National Weather Service returned ${res.status}`);
  return res.json() as Promise<T>;
}

// Daytime highs for the next 7 days at a town, from api.weather.gov (free, no key). Cached for an hour.
function weekForecast(town: Town): Promise<Forecast> {
  const cached = forecastCache.get(town.id);
  if (cached && Date.now() - cached.at < FORECAST_TTL_MS) return cached.value;
  const value = (async () => {
    const point = await nws<{ properties: { forecast: string } }>(`https://api.weather.gov/points/${town.lat},${town.lng}`);
    const forecast = await nws<{
      properties: { updateTime: string; periods: { isDaytime: boolean; temperature: number; temperatureUnit: string }[] };
    }>(point.properties.forecast);
    const highs = forecast.properties.periods
      .filter((p) => p.isDaytime)
      .map((p) => (p.temperatureUnit === "C" ? Math.round((p.temperature * 9) / 5 + 32) : p.temperature));
    if (!highs.length) throw new Error("Forecast had no daytime periods");
    return {
      highMin: Math.min(...highs),
      highMax: Math.max(...highs),
      daysAboveFreezing: highs.filter((h) => h > FREEZING_F).length,
      days: highs.length,
      place: town.name,
      updated: forecast.properties.updateTime,
      url: `https://forecast.weather.gov/MapClick.php?lat=${town.lat}&lon=${town.lng}`,
    };
  })();
  forecastCache.set(town.id, { at: Date.now(), value });
  value.catch(() => forecastCache.delete(town.id));
  return value;
}

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
export const periodLabel = ({ from, to }: RiskBasis["period"]) =>
  `${MONTH.format(new Date(`${from}-01T00:00:00Z`))}–${MONTH.format(new Date(`${to}-01T00:00:00Z`))} ${to.slice(0, 4)}`;

function reasonFor(county: string, ratio: number, forecast: Forecast | null, cold: boolean) {
  // One short, plain sentence; the exact numbers and period are in "Tick's evidence" on the town page.
  if (cold) return "It stays at or below freezing all week, so ticks are mostly inactive.";
  const compare = ratio >= 1.15 ? `${ratio.toFixed(1)}× the Massachusetts average` : ratio >= 0.85 ? "about the Massachusetts average" : "below the Massachusetts average";
  const visits = `Tick-borne disease ER visits in ${countyLabel(county)} are ${compare}`;
  if (!forecast) return `${visits}. No forecast right now.`;
  return `${visits}, and it's warm enough for ticks this week.`;
}

export async function getCountyRisk(county: string): Promise<CountyRisk> {
  const baseline = await getDphBaseline();
  const row = baseline.counties[county];
  if (!row) throw new Error(`No DPH data for ${county}`);
  const ratio = row.rate / baseline.stateRate;
  // DEMO_MODE stays offline: the DPH baseline only, and the reason says the forecast is missing.
  const forecast = isDemoMode() ? null : await weekForecast(forecastTown(county)).catch(() => null);
  const cold = forecast !== null && forecast.daysAboveFreezing === 0;
  const level: RiskLevel = cold ? "low" : ratio >= HIGH_RATIO ? "high" : ratio >= MODERATE_RATIO ? "moderate" : "low";
  return {
    county,
    weekOf: currentWeekOf(),
    level,
    reason: reasonFor(county, ratio, forecast, cold),
    basis: {
      county,
      countyRate: row.rate,
      stateRate: baseline.stateRate,
      period: baseline.period,
      dph: { url: baseline.reportUrl, listUrl: DPH_LIST_URL, live: baseline.live, checkedAt: baseline.checkedAt },
      forecast,
    },
  };
}

export async function getAllCountyRisks() {
  return Promise.all(DPH_COUNTIES.map(getCountyRisk));
}

export async function getTownRisk(town: Town): Promise<WeeklyRisk> {
  const { weekOf, level, reason, basis } = await getCountyRisk(dphCounty(town.county));
  return { townId: town.id, weekOf, level, reason, basis };
}

// 0..1 for the map, consistent with the levels: low < 0.4 <= moderate < 0.7 <= high (see riskFromIndex).
export function riskIndex({ level, basis }: Pick<CountyRisk, "level" | "basis">) {
  const ratio = basis ? basis.countyRate / basis.stateRate : 0;
  if (level === "high") return Math.min(1, 0.7 + (0.3 * (ratio - HIGH_RATIO)) / (HIGH_RATIO * 2));
  if (level === "moderate") return 0.4 + (0.29 * (ratio - MODERATE_RATIO)) / (HIGH_RATIO - MODERATE_RATIO);
  return basis?.forecast?.daysAboveFreezing === 0 ? 0.05 : Math.min(0.39, (0.39 * ratio) / MODERATE_RATIO);
}
