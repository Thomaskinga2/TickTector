# Design

- `lib/providers/dph.ts`: `getDphBaseline()` fetches the DPH list page with an identifying User-Agent, picks the newest report by the month and year in its URL, unzips `word/document.xml` with `node:zlib`, parses Table 1 and validates it (Requirement 1.2). In-memory cache: 6 h on success, 10 min retry on failure; never steps back to a period older than the bundled copy.
- `lib/data/county-baseline.json`: the fallback, built by `scripts/build-risk-baseline.mjs` from `data/massgov/syndromic_county.csv`; now records `reportUrl` and `builtAt`. All 104 CSV rows were checked against the 8 DPH reports on 2026-10-24.
- `RiskBasis.dph` is `{ url, listUrl, live, checkedAt }`; `RiskBasis.forecast.updated` is the NWS `updateTime`.
- `TickSpecies` drops the unsourced `danger` rating and gains `sources` and an optional `note`; `ActionAlert` gains `sources`. Text follows the cited pages (Mass. DPH prevention, Lyme, RMSF and alpha-gal pages; CDC Preventing tick bites and Where ticks live).
- `components/source-links.tsx`: `SourceLink` and `SourceList`, used by "Why this level", species and prevention modules.
- `lib/providers/geocoding.ts`: `censusProvider` (default, zod-validated) with the nearest-town fallback.
- Not live, on purpose: Census boundaries and the town list (change about once a decade; bundled for speed). CDC's tick-bite tracker has no public API, and Massachusetts reports no tick-borne diseases to CDC's NNDSS weekly feed for 2025–26.
