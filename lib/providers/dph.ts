import { inflateRawSync } from "node:zlib";
import bundled from "@/lib/data/county-baseline.json";
import { isDemoMode } from "@/lib/mock-data";

// Server-only: the Mass. DPH county numbers behind every level, straight from mass.gov.
//
// DPH has no API: it posts a Word report every month on the list page below. We read the newest one, take Table 1
// (ED visits with a tick-borne disease diagnosis, by county of residence, year to date) and check every row before
// using it. If mass.gov can't be reached or the table doesn't check out, the bundled copy of the last verified report
// (lib/data/county-baseline.json, from scripts/build-risk-baseline.mjs) is used instead, and the page says so.

export const DPH_LIST_URL = "https://www.mass.gov/lists/monthly-tick-borne-disease-reports";
const HEADERS = { "User-Agent": "TickTector (github.com/Thomaskinga2/my-app)" };
const TIMEOUT_MS = 10_000;
const TTL_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 10 * 60 * 1000;
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

export type CountyRow = { tickVisits: number; edVisits: number; rate: number };

export type DphBaseline = {
  period: { from: string; to: string }; // "2026-01" .. "2026-08"
  reportUrl: string;
  // Every county's visits added up. DPH doesn't print a statewide rate in Table 1; this is computed from its rows.
  stateRate: number;
  counties: Record<string, CountyRow>;
  live: boolean; // true: read from mass.gov on this server; false: the bundled copy
  checkedAt: string; // when mass.gov was read (live), or when the bundled copy was built
};

const BUNDLED: DphBaseline = {
  period: bundled.period,
  reportUrl: bundled.reportUrl,
  stateRate: bundled.stateRate,
  counties: bundled.counties,
  live: false,
  checkedAt: bundled.builtAt,
};

// The 13 DPH reporting groups (Dukes and Nantucket are reported together).
export const DPH_COUNTIES = Object.keys(BUNDLED.counties);

let cache: { at: number; ttl: number; value: Promise<DphBaseline> } | undefined;

export function getDphBaseline(): Promise<DphBaseline> {
  if (isDemoMode()) return Promise.resolve(BUNDLED);
  if (cache && Date.now() - cache.at < cache.ttl) return cache.value;
  const previous = cache?.value;
  const entry = { at: Date.now(), ttl: TTL_MS, value: Promise.resolve(BUNDLED) };
  entry.value = fetchLatest()
    // Never step back to an older period than the bundled copy.
    .then((live) => (live.period.to >= BUNDLED.period.to ? live : BUNDLED))
    .catch(async (error) => {
      console.warn(`Mass. DPH report unavailable, using the bundled copy: ${(error as Error).message}`);
      entry.ttl = RETRY_MS;
      const last = previous ? await previous : BUNDLED;
      return last.live ? last : BUNDLED;
    });
  cache = entry;
  return entry.value;
}

async function get(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`mass.gov returned ${res.status} for ${url}`);
  return res;
}

async function fetchLatest(): Promise<DphBaseline> {
  const html = await (await get(DPH_LIST_URL)).text();
  // Report links end in the period, e.g. "...-report-august-2026/download" or "...-report-january-december-2025/download".
  const reports = [...html.matchAll(/href="(?:https:\/\/www\.mass\.gov)?(\/doc\/[a-z0-9-]*syndromic-surveillance-report-([a-z-]+)-(\d{4})\/download)"/g)]
    .map(([, path, months, year]) => ({ url: `https://www.mass.gov${path}`, year, month: MONTHS.indexOf(months.split("-").at(-1)!) + 1 }))
    .filter((r) => r.month > 0)
    .sort((a, b) => b.year.localeCompare(a.year) || b.month - a.month);
  const latest = reports[0];
  if (!latest) throw new Error("no syndromic surveillance report linked");

  const xml = documentXml(Buffer.from(await (await get(latest.url)).arrayBuffer()));
  const text = (s: string) => decode([...s.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("")).trim();
  const paragraphs = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((m) => text(m[0]));
  // Table 1 must still be "by county <year> to date", so the period is January through the report month.
  if (!paragraphs.some((p) => p.startsWith("Table 1") && p.includes(`by county ${latest.year} to date`))) {
    throw new Error("Table 1 caption changed");
  }

  const table = xml.match(/<w:tbl\b[\s\S]*?<\/w:tbl>/)?.[0] ?? "";
  const rows = [...table.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)]
    .map((r) => [...r[0].matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)].map((c) => text(c[0])))
    .filter((cells) => cells.some(Boolean));
  const [header, ...body] = rows;
  if (header?.join("|") !== "County|Total Visits|Number of Tick-borne Disease Visits|Rate (Per 10,000) of Tick-borne Disease Visits") {
    throw new Error("Table 1 columns changed");
  }

  const counties: Record<string, CountyRow> = {};
  for (const [name, total, visits, rate] of body) {
    const county = name === "DUKES/NANTUCKET" ? "Dukes & Nantucket" : name.charAt(0) + name.slice(1).toLowerCase();
    const row = { edVisits: Number(total), tickVisits: Number(visits), rate: Number(rate) };
    // Each printed rate has to match its own counts.
    if (!DPH_COUNTIES.includes(county) || Math.abs((row.tickVisits / row.edVisits) * 10_000 - row.rate) > 0.01) {
      throw new Error(`Table 1 row doesn't check out: ${name}`);
    }
    counties[county] = row;
  }
  if (Object.keys(counties).length !== DPH_COUNTIES.length) throw new Error("Table 1 is missing counties");

  const rowsOf = Object.values(counties);
  const tick = rowsOf.reduce((s, r) => s + r.tickVisits, 0);
  const ed = rowsOf.reduce((s, r) => s + r.edVisits, 0);
  return {
    period: { from: `${latest.year}-01`, to: `${latest.year}-${String(latest.month).padStart(2, "0")}` },
    reportUrl: latest.url,
    stateRate: Math.round((tick / ed) * 10_000 * 100) / 100,
    counties,
    live: true,
    checkedAt: new Date().toISOString(),
  };
}

// word/document.xml out of a .docx (a zip), with Node's zlib only.
function documentXml(zip: Buffer) {
  let end = zip.length - 22;
  while (end >= 0 && zip.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error("report isn't a .docx");
  let at = zip.readUInt32LE(end + 16);
  for (let i = zip.readUInt16LE(end + 10); i > 0; i--) {
    const method = zip.readUInt16LE(at + 10);
    const size = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28);
    const offset = zip.readUInt32LE(at + 42);
    const name = zip.toString("utf8", at + 46, at + 46 + nameLength);
    if (name === "word/document.xml") {
      const start = offset + 30 + zip.readUInt16LE(offset + 26) + zip.readUInt16LE(offset + 28);
      const data = zip.subarray(start, start + size);
      return (method === 0 ? data : inflateRawSync(data)).toString("utf8");
    }
    at += 46 + nameLength + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32);
  }
  throw new Error("report has no document body");
}

function decode(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
