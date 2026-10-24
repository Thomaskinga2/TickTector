---
inclusion: always
---

# Tech stack & rules (hackathon mode: ship > perfect)

## Stack
- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui; lucide-react icons
- **AI:** Claude API via `@anthropic-ai/sdk` (or Amazon Bedrock if the event sponsors AWS credits). Call it ONLY from server code (`app/api/*/route.ts` or server actions). Never expose keys to the client.
- **Data (only if needed):** Supabase (Postgres + storage). Prefer no database for the MVP: keep state in memory / localStorage.
- **Maps/charts (if needed):** react-leaflet or Mapbox; Recharts.
- **Deploy:** Vercel. Deploy within the first 2 hours and redeploy often.

## Rules
1. Smallest working version first, then improve. Never leave the app in a broken state for more than ~30 minutes.
2. Every AI call: loading state, error state, timeout (~30s), and a **demo fallback** (cached example response in `lib/demo-data.ts`) so the live demo never dies on stage.
3. Ask the model for **structured JSON** output and validate it with zod before rendering.
4. Secrets only in `.env.local` (and Vercel env vars). Commit `.env.example`, never `.env.local`.
5. No new dependencies unless they save > 30 minutes.
6. Before saying a task is done: `npm run build` passes and the feature works in the browser.
7. Commit after every working step with a clear message.

## Commands
- `npm run dev` — local dev
- `npm run build` — must pass before every deploy
- `npx vercel --prod` — deploy
