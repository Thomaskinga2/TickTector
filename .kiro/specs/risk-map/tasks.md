# Implementation Plan

- [x] 1. Mock data for every heatmap town
  - Add the 7 heatmap towns that had no `TOWNS` / `WEEKLY_RISK` rows, with levels that match their index
  - _Requirements: 2.2, 4.1_

- [x] 2. Map foundation
- [x] 2.1 Add react-leaflet and Leaflet
  - `leaflet`, `react-leaflet`, `@types/leaflet`
  - _Requirements: 6.1_

- [x] 2.2 Shared helpers in `components/map-utils.ts`
  - `riskFromIndex`, `townName`, Massachusetts bounds
  - _Requirements: 1.1_

- [x] 2.3 Build `components/risk-map-canvas.tsx`
  - Esri World Topo tiles with attribution, bounds and zoom limits around Massachusetts
  - Zone circles and sticker pins (dot below zoom 9, name tag at 9+ or when selected)
  - Keyboard-focusable pins with accessible names; fly to the selected town (no animation with reduced motion)
  - `compact` mode with all interaction off
  - _Requirements: 1.1, 1.3, 1.4, 2.1, 4.2, 4.4, 5.1, 6.2_

- [x] 2.4 Rewrite `components/heatmap.tsx` as the client wrapper
  - `next/dynamic` with `ssr: false`, loading placeholder, `slotStatus`, `isolate` wrapper, legend
  - _Requirements: 1.2, 1.5, 6.1, 6.3_

- [x] 3. `/map` experience
- [x] 3.1 Filter chips with counts (`aria-pressed`)
  - _Requirements: 3.1, 3.2, 4.3_

- [x] 3.2 `TownRiskCard`: selected town, level, weekly reason, link to the area page, close
  - _Requirements: 2.2, 2.3, 2.4, 3.3_

- [x] 3.3 `RiskTownList`: towns sorted by index, linking to area pages
  - _Requirements: 4.1, 3.2_

- [x] 3.4 Compose `app/map/page.tsx`
  - _Requirements: 1.1, 2.1, 3.2_

- [x] 4. Map preview on town pages
  - Keep `<Link href="/map">` around a compact map in `area-view.tsx`
  - _Requirements: 5.1, 5.2_

- [x] 5. Turn on `features.heatmap`
  - _Requirements: 6.3_

- [x] 6. Checkpoint: verify
  - typecheck, lint, build; browser check at phone and desktop width; no console errors
  - _Requirements: 6.1_
