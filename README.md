<p align="center"><img src="public/icon-192.png" width="112" alt="Tick, the TickTector detective"></p>

# TickTector

How risky are ticks in your Massachusetts town this week, why, and what should you do about it?

TickTector is a mobile-first web app. Search a town to see this week's tick risk level with a plain-language reason, prevention steps for that level, the tick species found there, a statewide risk map, and sightings reported by neighbors.

> **Real, cited, live data.** Weekly levels come from the newest Massachusetts DPH tick-borne disease surveillance report (ER visits by county, read from mass.gov) and the live National Weather Service forecast, by a stated rule shown on every town page. Towns and map boundaries are US Census Bureau data; "my location" uses the Census Geocoder API. Species facts and prevention steps quote Mass. DPH and the CDC, with a source link under each module. Nothing on the site is made up. Levels are estimates: information only, not medical advice.

## Features

| Feature | Where | Status |
| --- | --- | --- |
| Town search, browse by county | Home | Live: all 351 cities and towns (US Census) |
| Weekly risk, reason, "Why this level" and "what to do" steps | `/area/[town]` | Live: newest Mass. DPH report + National Weather Service API |
| Tick species by town | `/area/[town]` | Live: deer and dog ticks statewide, lone star ticks on Cape Cod and the Islands |
| "Did you know?" tick facts | `/area/[town]` | Live: a new fact each day, each quoted from Mass. DPH with a source link; three are computed from the newest DPH report |
| Risk map with filters | `/map` | Live: TickTector's own vector map from Census boundaries, no tile server |
| Sightings forum (posts with an optional photo, comments) | `/forum` | Live, in-memory (resets on each deploy); starts empty, real posts only |
| Towns near you | Home | Live: asks for your location on load (Census Geocoder); until then, approximate from your IP via Vercel's geo headers |
| Tick photo scan | `/scan` | Coming soon (`features.camera`) |
| TickQuest | `/quest` | Coming soon (`features.quest`) |

Feature flags live in `lib/features.ts`.

## How it works

```
page (app/) -> component (components/) -> service (lib/services/) -> API route (app/api/) -> provider / lib/data
```

- **Weekly level, per county** (DPH reports no town-level numbers, so each town takes its county's level):
  1. Baseline: the county's rate of ER visits diagnosed as a tick-borne disease (per 10,000 ER visits, Table 1 of the newest DPH report, year to date) against all counties combined. 1.5× or more is High, 0.75× or more is Moderate, lower is Low. This rule is TickTector's, not DPH's, and the page says so.
  2. This week: if no day in the NWS 7-day forecast gets above freezing, the level is Low (Mass. DPH: ticks can be out any time temperatures are above freezing).
- **Live sources** (no keys): `lib/providers/dph.ts` reads the newest report from the [DPH list page](https://www.mass.gov/lists/monthly-tick-borne-disease-reports) every 6 hours, parses Table 1 and checks every row (columns, all 13 county groups, each rate against its own counts) before using it. NWS forecasts are cached for an hour and show their update time. The Census Geocoder finds the town whose boundary contains a point.
- **Fallbacks:** if mass.gov can't be read or Table 1 doesn't check out, the bundled copy of the last verified report is used and the page says so. If the forecast can't be loaded, the level uses the DPH numbers alone and the page says so. If the Census Geocoder is down, the nearest town is used. `DEMO_MODE=1` skips every live call.
- Bundled data is generated, not typed in: `node scripts/build-map.mjs <census folder>` (Census → `public/map/` and `lib/data/ma-towns.json`), `node scripts/build-radar-map.mjs` (that map → the small Massachusetts outline in Home's radar, `lib/data/radar-map.json`), `node scripts/build-risk-baseline.mjs` (DPH CSV → `lib/data/county-baseline.json`, the fallback), `node scripts/make-icons.mjs` (app icons). All 104 rows of `data/massgov/syndromic_county.csv` (2019 – Aug 2026) were checked against the 8 DPH reports on 2026-10-24.
- Sighting locations are rounded to about 1 km before they're stored or shown. Sighting photos are resized in the browser and stored without EXIF or other metadata (so no GPS).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Leaflet (pan/zoom only) drawing our own Census vector map · Motion (motion.dev) · zod · Vercel

## Run it

```bash
npm install
cp .env.example .env.local   # optional; no keys needed
npm run dev                  # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (what Vercel runs) |
| `npm run typecheck` | Route types + TypeScript |
| `npm run lint` | ESLint |

## Built with Kiro

Product, stack and structure steering, feature specs and agent hooks live in [`.kiro/`](.kiro). Team workflow and file ownership are in [TEAM.md](TEAM.md).

## Sources

Government sources only. Links checked 2026-10-24.

- Massachusetts DPH, Bureau of Infectious Disease and Laboratory Sciences, [Tick Exposure and Tick-borne Disease Syndromic Surveillance Reports](https://www.mass.gov/lists/monthly-tick-borne-disease-reports), Table 1 (ED visits with a tick-borne disease diagnosis, by county of residence; read live). DPH data are preliminary and subject to change.
- National Weather Service, [api.weather.gov](https://www.weather.gov/documentation/services-web-api) 7-day forecasts (live)
- US Census Bureau, [2023 cartographic boundary files](https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html) (cities and towns, counties, states; public domain) and the [Census Geocoder API](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html) (live)
- Massachusetts DPH, [Tick-borne disease prevention](https://www.mass.gov/info-details/tick-borne-disease-prevention) (species, where they live, when they bite, what they spread), [Lyme disease](https://www.mass.gov/info-details/lyme-disease) (seasons, repellents, clothing), [Rocky Mountain spotted fever](https://www.mass.gov/info-details/rocky-mountain-spotted-fever) and [Alpha-gal syndrome](https://www.mass.gov/info-details/alpha-gal-syndrome-ags) (lone star ticks on Cape Cod and the Islands)
- CDC, [Preventing tick bites](https://www.cdc.gov/ticks/prevention/index.html) (permethrin, showering, drying clothes, tick checks) and [Where ticks live](https://www.cdc.gov/ticks/about/where-ticks-live.html) (scientific names)
