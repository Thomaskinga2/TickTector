---
inclusion: fileMatch
fileMatchPattern: "app/api/**/*"
---

# API route conventions

`app/api/risk/route.ts` and `app/api/scan/route.ts` are the reference implementations.

## Shape of a route
1. Start with a contract comment: `// GET /api/risk?town=amherst -> WeeklyRisk`. The return type comes from `lib/types.ts`.
2. Read and validate input first (`request.nextUrl.searchParams`, `request.formData()`, `request.json()`). Reject bad input with a short, user-readable message:
   - `400` for missing or invalid input, `404` when there's no data for it, `413` for oversized uploads
   - body: `Response.json({ error: "Attach a photo of the tick" }, { status: 400 })`
3. Return `Response.json(data)` with exactly the shape in `lib/types.ts`, so the UI never branches on mock vs. real.
4. Serve only real, sourced data. If a feature has no real data yet, return an honest error (`501` "isn't available yet") or an empty list, never sample rows. Leave a `// TODO` saying where the real data will come from.

## Switching a route to real data
- Check `isDemoMode()` from `lib/mock-data.ts` first: in demo mode, skip live network calls and serve the bundled real data (`lib/data/`).
- Put external access behind a provider in `lib/providers/`, selected by an env var, with a `mock` implementation that stays the default.
- Call external services with `AbortSignal.timeout(...)`: about 8 s for plain APIs, about 30 s for AI calls.
- Validate external JSON (and all AI output) with zod. On failure or timeout, fall back to the bundled real data and say what's missing (e.g. "The weather forecast couldn't be loaded"), never to invented values.
- Read keys from server-only env vars and add them to `.env.example`. Never return them or put them in `NEXT_PUBLIC_*`.

## Caching
`cacheComponents` is on. A `GET` handler that reads no request data (like `app/api/heatmap/route.ts`) is prerendered at build time. That's fine for static data. Once it serves live data, call `await connection()` from `next/server` first so it runs per request.

## Client side
- Add or update the matching function in `lib/services/<area>.ts`, going through `getJson` so `{ error }` bodies become thrown errors.
- Components never call `fetch` directly.

## Ownership
Routes belong to Backend 1 or Backend 2 (see `TEAM.md`). Ask the owner before editing a route that isn't yours.
