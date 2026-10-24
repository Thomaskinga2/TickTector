# TikTector team workflow

3 people, one repo. `main` auto-deploys to Vercel. **Never push a broken `main`.**

## How a feature is wired

```
page (app/)  ->  component (components/)  ->  service (lib/services/)  ->  API route (app/api/<feature>/)  ->  provider / mock
                                                                                                             (lib/providers/, lib/mock-data.ts)
```

- Pages and components call **service functions only**, never mock data or `fetch` directly.
- To go from mock to real data, change only the API route or the provider. The UI stays the same.
- Every slot that still returns mock data has a `// TODO`. Run `grep -rn TODO app lib components` to list them.
- `DEMO_MODE=1` forces every API route onto mock data. Any real data you add must check `isDemoMode()` from `lib/mock-data.ts` first.

## Roles

| Role | Owns | Ask before touching |
|---|---|---|
| **Frontend** | `app/**/page.tsx`, `app/**/*-view.tsx`, `components/`, `app/globals.css`, `public/`, `lib/use-*.ts` | `app/api/`, `lib/providers/` |
| **Backend 1: location, risk, map** | `app/api/towns/`, `app/api/risk/`, `app/api/heatmap/`, `lib/providers/geocoding.ts`, `lib/services/towns.ts`, `lib/services/heatmap.ts` | `components/` |
| **Backend 2: species, alerts, scan, forum** | `app/api/species/`, `app/api/alerts/`, `app/api/scan/`, `app/api/forum/`, `lib/providers/forum-store.ts`, `lib/services/scan.ts`, `lib/services/forum.ts` | `components/` |
| **Shared** | `lib/types.ts`, `lib/features.ts`, `app/layout.tsx`, `lib/mock-data.ts` | Post in team chat first; small commits |

`lib/services/risk.ts` holds `getWeeklyRisk` (Backend 1) next to `getSpecies` and `getAlerts` (Backend 2). Edit only your own functions.

## Feature slots

| Feature | Page | Component | Service | API route | Backend owner | Turn on |
|---|---|---|---|---|---|---|
| Town search | `/` | `TownSearch` | `searchTowns` (`towns.ts`) | `GET /api/towns?q=` | Backend 1 | always on |
| My location | `/`, `/forum/new` | `LocationButton`, `useGeolocation` | `findNearestTown` (`towns.ts`) | `GET /api/towns/nearest?lat=&lng=` | Backend 1 | `geolocation: true` (on) |
| Risk gauge | `/area/[town]` | `RiskGauge` | `getWeeklyRisk` (`risk.ts`) | `GET /api/risk?town=` | Backend 1 | always on |
| Charts | `/area/[town]` | `TownCharts`, `charts.tsx` | `getStatewideStats`, `getTownStats` (`stats.ts`) | `GET /api/stats/statewide`, `GET /api/stats?town=` | Backend 1 | always on |
| Risk map | `/map`, `/area/[town]` | `Heatmap`, `MapLegend` | `getHeatmap`, `getMapShapes` (`heatmap.ts`) | `GET /api/heatmap` + `public/geo/ma-towns.json` | Backend 1 | `heatmap: true` (on) |
| Tick species | `/area/[town]` | `TickSpeciesList` | `getSpecies` (`risk.ts`) | `GET /api/species?town=` | Backend 2 | always on |
| Action alerts | `/area/[town]` | `ActionAlerts` | `getAlerts` (`risk.ts`) | `GET /api/alerts?level=` | Backend 2 | always on |
| Camera scan | `/scan` | `CameraCapture` | `analyzeTickPhoto` (`scan.ts`) | `POST /api/scan` | Backend 2 | `camera: true` |
| Forum | `/forum`, `/forum/new`, `/forum/[id]` | `ForumPostList`, `ForumPostCard`, `NewPostForm`, `CommentThread` | `forum.ts` | `/api/forum/posts`, `/api/forum/posts/[id]`, `/api/forum/posts/[id]/comments` | Backend 2 | `forum: true` |
| TikQuest | `/quest` | page only | none | none | Frontend | `quest: true` |

Flags live in `lib/features.ts`. A flag set to `false` shows "Coming soon"; flipping it to `true` is the only change needed to show the real component.

Risk levels, chart numbers and the map come from real MA DPH county data (see `data/README.md`). The rule lives in `lib/risk-model.ts` (`CUTOFFS`, winter step-down); species and prevention facts live in `lib/tick-facts.ts` with their sources.

Providers are picked by env vars (see `.env.example`): `GEOCODING_PROVIDER` (Backend 1) and `FORUM_STORE` (Backend 2). Only `mock` is implemented. The mock forum store keeps posts in memory, so they reset on every deploy.

## Git

```bash
git checkout main && git pull
git checkout -b be-risk/weekly-risk-data     # ui/*, be-risk/*, be-species/*
# ...work...
npm run build                                # must pass before you push
git commit -m "feat: weekly risk from real data"
git push -u origin be-risk/weekly-risk-data
gh pr create --fill                          # or open the PR on GitHub
```

1. One branch per change: `ui/*` (Frontend), `be-risk/*` (Backend 1), `be-species/*` (Backend 2).
2. `npm run build` passes, then open a PR.
3. One teammate reviews: does it build, does the page still work on a phone?
4. Merge to `main`. Vercel deploys automatically.

- Never push to `main` directly and never force-push `main`.
- Pull `main` often. A merge conflict in a file you don't own goes to its owner.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```
