---
inclusion: always
---

# Project structure

## How a feature is wired

```
page (app/) -> component (components/) -> service (lib/services/) -> API route (app/api/<feature>/) -> provider / mock
                                                                                                    (lib/providers/, lib/mock-data.ts)
```

- Pages and components call **service functions only**, never mock data or `fetch` directly.
- Going from mock to real data changes only the API route or the provider; the UI stays the same.
- Every slot still on mock data has a `// TODO`. List them with `grep -rn TODO app lib components`.

## Layout

```
app/
  page.tsx                  Home: town search, my location, "Try Amherst"
  area/[town]/              Town view: risk gauge, species, alerts, heatmap
  map/  scan/  quest/       Heatmap, camera scan, TikQuest
  forum/                    Post list, new post, post detail
  api/<feature>/route.ts    One route per feature: towns, risk, heatmap, species, alerts, scan, forum
  manifest.ts               PWA manifest
components/                 UI pieces named by what the user sees (RiskGauge, TownSearch, ...)
  ui/                       shadcn/ui primitives
  states.tsx                LoadingState, ErrorState, EmptyState, ComingSoon, Disclaimer
  page.tsx                  Page and Section wrappers
lib/
  services/                 Client-side service functions, one file per area, all via getJson (http.ts)
  providers/                Server-side providers picked by env vars (geocoding, forum store)
  mock-data.ts              Mock data and isDemoMode()
  features.ts               Feature flags: false shows "Coming soon"
  types.ts                  Shared types (the contract between frontend and backend)
  use-async.ts              Service call with loading / error / retry
  use-geolocation.ts        Browser location hook
data/                       Real datasets go here
.kiro/                      Steering, hooks and specs (committed)
```

## Conventions
- File names use **kebab-case** (`risk-gauge.tsx`); components are **PascalCase** named exports (`RiskGauge`).
- Each API route starts with a comment documenting its contract, e.g. `// GET /api/risk?town=amherst -> WeeklyRisk`.
- Shared types change only in `lib/types.ts`, and both sides adopt them in the same PR.
- Import with the `@/` alias from the project root.

## Team workflow and file ownership

#[[file:TEAM.md]]
