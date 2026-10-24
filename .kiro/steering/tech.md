---
inclusion: always
---

# Tech stack & rules (hackathon mode: ship > perfect)

## Stack
- **Framework:** Next.js 16 (App Router) + TypeScript (strict)
- **UI:** Tailwind CSS v4 + shadcn/ui (`components/ui/`); lucide-react icons. Theme tokens live in `app/globals.css` (field-guide palette, plus `risk-low` / `risk-moderate` / `risk-high`).
- **Validation:** zod for every JSON contract that crosses a boundary (AI output, external APIs).
- **AI (scan feature):** a vision model called ONLY from `app/api/scan/route.ts`. The provider isn't chosen yet; whoever builds the scan feature adds its SDK and a server-only key. Never expose keys to the client.
- **Data:** mock data in `lib/mock-data.ts` until real datasets land in `data/`. Providers are picked by env vars (`GEOCODING_PROVIDER`, `FORUM_STORE`). Prefer no database for the MVP; use Supabase (Postgres + storage) only if a feature truly needs it.
- **Maps/charts (if needed):** react-leaflet or Mapbox; Recharts.
- **Deploy:** Vercel. `main` auto-deploys; every pull request gets a preview URL.

## Rules
1. Working demo > clean architecture. Smallest working step first; never leave `main` broken, because it is the live demo.
2. Before coding a feature, state a 3–5 line plan, then build it.
3. Every API or AI call has a loading state, an error state and a demo fallback. Use `useAsync` with the shared states in `components/states.tsx` (`LoadingState`, `ErrorState`, `EmptyState`, `ComingSoon`). AI calls also get a ~30 s timeout.
4. `DEMO_MODE=1` forces every API route onto mock data. Any real data source must check `isDemoMode()` from `lib/mock-data.ts` first.
5. Ask AI models for **structured JSON** and validate it with zod before rendering.
6. Secrets only in `.env.local` and Vercel env vars, never in `NEXT_PUBLIC_*` variables. Commit `.env.example`, never `.env.local`.
7. No new dependencies unless they save more than 30 minutes; tell the team first.
8. Don't add auth, payments or admin features.
9. When something fails twice, stop and propose a simpler approach instead of retrying.
10. UI work: bold, intentional design, not generic defaults. Use the theme tokens, never hard-coded colors, and check every screen at phone width.
11. Before saying a task is done, `npm run build` passes and the feature works in the browser.
12. Commit after every working step with a clear message (`feat: …`, `fix: …`, `chore: …`), on a branch, and merge through a pull request. See `TEAM.md`.
13. The team may talk in Vietnamese; write code, comments and commits in English.
14. This Next.js version has breaking changes from older releases. Check `node_modules/next/dist/docs/` before using an API that isn't already used in this repo.

## Commands
- `npm run dev`: local dev server on http://localhost:3000
- `npm run typecheck`: generate route types and type-check
- `npm run lint`: ESLint
- `npm run build`: production build, the same one Vercel runs. It must pass before every PR.
