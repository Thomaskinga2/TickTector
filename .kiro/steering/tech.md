---
inclusion: always
---

# Tech stack & rules (hackathon mode: ship > perfect)

## Stack
- **Framework:** Next.js 16 (App Router) with React 19 and TypeScript (strict)
- **UI:** Tailwind CSS v4. Theme tokens are CSS variables in `app/globals.css`, exposed as Tailwind colors (`bg-paper`, `text-ink`, `bg-accent`, …)
- **Fonts:** `next/font/google` with Geist (body) and Instrument Serif (display)
- **AI / backend:** called only from server code (`app/api/*/route.ts`). The browser never talks to an external API or holds a key.
- **Deploy:** Vercel. The GitHub repo is connected, so every push to `main` deploys to production and every pull request gets a preview URL.

## Rules
1. Smallest working version first, then improve. Never leave `main` broken: it is the live demo.
2. Every API or AI call has a loading state, an error state, a timeout, and a **demo fallback**, so the live demo never dies on stage. Today the fallback is the mock in `app/api/ping/route.ts`; AI features keep cached example responses in `lib/demo-data.ts`.
3. Ask AI models for **structured JSON** and validate the shape before rendering. Ask before adding a validation library.
4. Secrets live only in `.env.local` and Vercel environment variables, never in `NEXT_PUBLIC_*` variables. Commit `.env.example`, never `.env.local`.
5. No new dependencies without asking first, and only if they save more than 30 minutes.
6. Prefer built-in Next.js features (`next/font`, `next/image`, route handlers, metadata) over extra packages.
7. Server components by default. Add `'use client'` only to components that need state, effects or event handlers.
8. Colors come from the theme tokens, never hard-coded hex values in components. Light and dark mode both have to work.
9. Accessibility: real `<button>` and `<a>` elements, visible focus, `aria-live` for async results, body text contrast of at least 4.5:1.
10. Before saying a task is done, `npm run build` passes and the feature works in the browser.
11. Commit after every working step with a clear message (`feat: …`, `fix: …`, `docs: …`).
12. This Next.js version has breaking changes from older releases. Check `node_modules/next/dist/docs/` before using an API that isn't already used in this repo.

## Commands
- `npm run dev`: local dev server on http://localhost:3000
- `npm run typecheck`: generate route types and type-check
- `npm run lint`: ESLint
- `npm run build`: production build, the same one Vercel runs. It must pass before every push to `main`.
