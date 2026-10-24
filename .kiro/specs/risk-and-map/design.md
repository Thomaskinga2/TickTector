# Design Document

## Overview

Weekly tick risk for all 351 Massachusetts cities and towns, computed only from published data, and a map TickTector draws itself. Requirements are in `requirements.md` (Backend 1). Product owner decision during this work: **nothing on the site may be invented**. That rules out mock fallbacks, so where the requirements say "return the mock Weekly_Risk", this design returns the level from the DPH data alone and says the forecast is missing (see Error Handling).

## Data sources

| Source | What we use | How it gets in |
| --- | --- | --- |
| US Census Bureau, 2023 cartographic boundary files, 1:500,000 (public domain) | All 351 county subdivisions (cities and towns) with county, counties, state outlines | `scripts/build-map.mjs` → `public/map/massachusetts.json` (98 KB gzipped) and `lib/data/ma-towns.json` |
| Mass. DPH tick-borne disease syndromic surveillance (monthly reports, extracted on `be-risk/tick-data`) | Tick-borne disease ER visits per 10,000 ER visits, by county, latest period (Jan–Aug 2026) | `scripts/build-risk-baseline.mjs` reads `data/massgov/syndromic_county.csv` → `lib/data/county-baseline.json` |
| National Weather Service, api.weather.gov (free, no key) | 7-day forecast daytime highs at one town near the middle of each county | Live, server-side, cached 1 hour, 8 s timeout |
| Mass. DPH tick-borne disease information | "Deer ticks are active any day above freezing"; lone star ticks on Cape Cod and the Islands | Rule text and species ranges |

DPH publishes no town-level numbers (only map images), so the finest real level is the county. Dukes and Nantucket are reported together as "Dukes & Nantucket".

## The rule

1. **Baseline:** ratio = county rate ÷ state rate (state rate = all county tick visits ÷ all county ER visits). High if ratio ≥ 1.5, Moderate if ≥ 0.75, otherwise Low.
2. **This week:** if no daytime high in the 7-day forecast is above 32 °F, the level is Low (deer ticks are mostly inactive below freezing).
3. **Town:** a town takes its county's level, reason and basis.
4. **Reason (≤ 120 characters):** "{County} tick ER visits run {ratio}× the state rate in {year}, and highs of {min}–{max}°F keep ticks active."
5. **Map value (0..1):** a monotonic function of level and ratio that respects the existing cutoffs (`riskFromIndex`: < 0.4 Low, < 0.7 Moderate, else High).

With the August 2026 report: High for Dukes & Nantucket, Berkshire, Barnstable, Franklin and Plymouth; Moderate for Bristol, Hampshire, Worcester; Low for Norfolk, Essex, Middlesex, Hampden and Suffolk.

## Architecture

- `lib/providers/risk.ts` (server): `MA_TOWNS`, `findTown`, `getCountyRisk`, `getAllCountyRisks`, `getTownRisk`, `riskIndex`, NWS fetch with cache and timeout.
- Routes: `GET /api/risk?town=` (404 for anything that isn't one of the 351), `GET /api/risk/counties` (new), `GET /api/heatmap` (351 points), all per request (`await connection()` where there's no request data).
- `lib/types.ts` (additive): `RiskBasis` on `WeeklyRisk.basis`, `CountyRisk`.
- Towns API, nearest-town and species routes use the Census list; lone star tick range is by county.
- UI: Home browses counties (Weather-style cards) and searches all 351 towns; the town page adds "Why this level" with the numbers and source links; the map page ranks counties.

### The map

- `components/risk-map-canvas.tsx` draws `public/map/massachusetts.json` with Leaflet as the pan/zoom engine only: no tile server, no third-party map API, no key.
- Layers in three panes (land, towns, lines), each with its own SVG renderer padded a full view on every side so shapes never clip while dragging.
- Each town path is created once; level, filter and selection toggle its classes in place (no remounts, no flicker). Label icons are cached.
- Labels: county names below zoom 9.25, town names from zoom 10, only inside the view. Panning is held to Massachusetts.
- Our own glass zoom and "show all of Massachusetts" controls replace Leaflet's.
- Palette tokens are scoped to `.risk-map` (light only).

## Error Handling

- NWS down or slow (8 s): level from the DPH baseline only; reason says the forecast couldn't be loaded; "Why this level" says so too.
- `DEMO_MODE=1`: same as NWS down, without trying (offline demo).
- Unknown town id: 404 from the API, Next.js 404 page for `/area/<id>`.
- Basemap fails to load: the map shows "The map couldn't load. Try again".
- Forum: starts empty; only real posts are shown. Scan returns 501 instead of a made-up identification.

## Correctness Properties

### Property 1: Every level traces to a source
*For any* town and week, the returned level equals the rule applied to the DPH county rate and the NWS forecast in its `basis`, and the reason names the same ratio and highs.
**Validates: Requirements 1.1, 1.2**

### Property 2: Same week, same answer
*For any* town, repeated calls within the forecast cache window return the same level and reason.
**Validates: Requirements 1.3**

### Property 3: Map and risk agree
*For any* town, `riskFromIndex(heatmap value)` equals the level from `/api/risk` for that town.
**Validates: Requirements 2.2**

### Property 4: Coverage
*For any* of the 351 Census cities and towns, `/api/risk` returns a level and `/api/heatmap` returns exactly one point; for any other id, `/api/risk` returns 404.
**Validates: Requirements 1.4, 2.1**

### Property 5: Nothing invented
*For any* screen, every number shown (rates, highs, counts) appears in `lib/data/*.json` or the live NWS response, and no sample rows remain in `lib/mock-data.ts` or the forum store.
**Validates: product owner decision**

## Testing Strategy

- `npm run typecheck`, `npm run lint`, `npm run build`.
- API checks: all 13 county groups, 351 heatmap points, 404 for an unknown town, reason length ≤ 120.
- Map in the browser at 393 × 852: drag, zoom, filter, select, show-all, no clipped shapes, no console errors.
