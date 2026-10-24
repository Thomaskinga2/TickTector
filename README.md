# My App

A minimal Next.js baseline for a one-day hackathon, deployed on Vercel.

## Requirements
- Node.js 20.9 or later
- npm

## Setup

```bash
npm install
cp .env.example .env.local   # optional
```

| Variable | Required | What it does |
| --- | --- | --- |
| `API_URL` | No | Base URL of your backend. Leave it empty and `/api/ping` returns a mock response, so the app works without a backend. |
| `API_KEY` | No | Sent to your backend as a Bearer token, from the server only. |

Both are server-only, so the browser never sees them. Don't add secrets as `NEXT_PUBLIC_*` variables: those are bundled into the page.

## Develop

```bash
npm run dev
```

Open http://localhost:3000.

## Deploy

The GitHub repo is connected to Vercel:

- Every push to `main` deploys to production.
- Pull requests get a preview URL.

To use a real backend, add `API_URL` (and `API_KEY` if needed) in Vercel under **Project Settings → Environment Variables**, then redeploy.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (what Vercel runs) |
| `npm start` | Serve the production build locally |
| `npm run lint` | Lint with ESLint |
| `npm run typecheck` | Generate route types and type-check |

## Project structure

See [`.kiro/steering/structure.md`](.kiro/steering/structure.md). Stack and rules are in [`.kiro/steering/tech.md`](.kiro/steering/tech.md).
