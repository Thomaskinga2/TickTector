// Builds lib/data/county-baseline.json from Mass. DPH syndromic surveillance (data/massgov/syndromic_county.csv):
// emergency department visits for tick-borne disease per 10,000 ED visits, by county, for the latest period.
// Source: Massachusetts DPH, Bureau of Infectious Disease and Laboratory Sciences, monthly tick-borne disease reports
// (https://www.mass.gov/lists/monthly-tick-borne-disease-reports). DPH data are preliminary and subject to change.
//
// This bundled copy is the fallback: lib/providers/dph.ts reads the newest report from mass.gov at runtime.
//
// Usage: node scripts/build-risk-baseline.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const rows = readFileSync("data/massgov/syndromic_county.csv", "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [period, county, edVisits, tickVisits, rate, sourceTable] = line.split(",");
    return { period, county, edVisits: Number(edVisits), tickVisits: Number(tickVisits), rate: Number(rate), sourceTable };
  });

// Periods look like "2026-01..2026-08"; the latest one sorts last.
const latest = [...new Set(rows.map((r) => r.period))].sort().at(-1);
const current = rows.filter((r) => r.period === latest);
const totalEd = current.reduce((sum, r) => sum + r.edVisits, 0);
const totalTick = current.reduce((sum, r) => sum + r.tickVisits, 0);
const [from, to] = latest.split("..");

const baseline = {
  source: "Massachusetts Department of Public Health, tick-borne disease syndromic surveillance report",
  sourceUrl: "https://www.mass.gov/lists/monthly-tick-borne-disease-reports",
  sourceTable: current[0].sourceTable,
  // The report this table came from: "<report slug>__t01.csv" is Table 1 of mass.gov/doc/<report slug>.
  reportUrl: `https://www.mass.gov/doc/${current[0].sourceTable.replace(/__t\d+\.csv$/, "")}/download`,
  builtAt: new Date().toISOString(),
  period: { from, to },
  // Statewide rate from the county rows (the same counts DPH publishes per county).
  stateRate: Math.round((totalTick / totalEd) * 10000 * 100) / 100,
  counties: Object.fromEntries(
    current.map((r) => [r.county, { tickVisits: r.tickVisits, edVisits: r.edVisits, rate: r.rate }]),
  ),
};

mkdirSync("lib/data", { recursive: true });
writeFileSync("lib/data/county-baseline.json", JSON.stringify(baseline, null, 2) + "\n");
console.log(`lib/data/county-baseline.json: ${latest}, ${current.length} counties, state rate ${baseline.stateRate} per 10k ED visits`);
