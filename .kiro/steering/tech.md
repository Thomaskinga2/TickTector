# Tech

## Stack
- Next.js 16 (App Router) with React 19 and TypeScript
- Tailwind CSS v4, with theme tokens as CSS variables in `app/globals.css`
- Fonts via `next/font/google`: Geist (body) and Instrument Serif (display)
- Hosted on Vercel. The GitHub repo is connected, so every push to `main` deploys.

## Rules
- **TypeScript strict mode** stays on. Avoid `any`; if it's unavoidable, add a comment explaining why.
- **Function components only.** Server components by default; add `'use client'` only to components that need state, effects or event handlers.
- **No secrets in the browser.** Only `NEXT_PUBLIC_*` variables reach the client, and anyone can read them. API keys stay in server-only env vars (`API_URL`, `API_KEY`) and are used in route handlers.
- **The browser calls our own routes** (`/api/*`) through `lib/api.ts`. Route handlers call the real backend.
- Every API call has loading, success and error states, and a mock fallback when `API_URL` is unset.
- `cacheComponents` is on. Route handlers that must run per request call `await connection()` from `next/server`.
- **No new dependencies without asking first.**
- Prefer built-in Next.js features (`next/font`, `next/image`, route handlers, metadata) over extra packages.
- Colors come from the theme tokens (`bg-paper`, `text-ink`, `bg-accent`, …). Don't hard-code hex values in components. Light and dark mode both have to work.
- Accessibility: real `<button>`s and links, visible focus, `aria-live` for async results, and contrast of at least 4.5:1 for body text.
- This Next.js version has breaking changes from older releases. Check `node_modules/next/dist/docs/` before using an API you haven't used here.

## Checks before pushing
- `npm run typecheck`
- `npm run lint`
- `npm run build` (the same build Vercel runs)
