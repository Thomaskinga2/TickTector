# Implementation Plan

- [x] 1. Data
- [x] 1.1 `scripts/build-map.mjs`: Census shapefiles → `public/map/massachusetts.json` + `lib/data/ma-towns.json` (no dependencies)
  - _Requirements: 2.1, 3.1_
- [x] 1.2 `scripts/build-risk-baseline.mjs`: DPH syndromic CSV → `lib/data/county-baseline.json`
  - _Requirements: 1.1_

- [x] 2. Risk provider and routes
- [x] 2.1 `lib/providers/risk.ts`: the rule, NWS forecast with cache and 8 s timeout, DEMO_MODE offline
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 4.1, 4.2_
- [x] 2.2 `/api/risk`, new `/api/risk/counties`, `/api/heatmap` for 351 towns (per request)
  - _Requirements: 1.4, 2.1, 2.2, 2.3_
- [x] 2.3 Towns, nearest-town and species routes on the Census list; lone star range by county
  - _Requirements: 1.4_
- [x] 2.4 Remove invented rows: mock towns, weekly risk, heatmap, scan result, seeded forum posts and comments
  - _Requirements: product owner decision_

- [x] 3. UI
- [x] 3.1 Home: county cards + search across 351 towns
  - _Requirements: 1.1_
- [x] 3.2 Town page: "Why this level" with DPH and NWS numbers and source links; 404 for unknown towns
  - _Requirements: 1.2_
- [x] 3.3 Map page: county ranking
  - _Requirements: 2.1_

- [x] 4. Our own vector map
- [x] 4.1 Census layers in panes with padded renderers; towns shaded by level; county and town labels
  - _Requirements: 3.1, 3.3_
- [x] 4.2 Tap a town → card; fly to it; filter in place; held to Massachusetts; glass zoom and show-all controls
  - _Requirements: 3.2_
- [x] 4.3 Loading and error states for the basemap
  - _Requirements: 3.4_

- [x] 5. Checkpoint: typecheck, lint, build; API checks; browser checks light and dark
