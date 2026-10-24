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

## Built with Kiro

The project is set up for [Kiro](https://kiro.dev). Everything lives in `.kiro/` and is committed:

| Path | What it is |
| --- | --- |
| `.kiro/steering/product.md`, `tech.md`, `structure.md` | Always-on context: the product and demo flow, stack and rules, folder layout |
| `.kiro/steering/api-routes.md` | Route handler conventions, loaded when working in `app/api/` |
| `.kiro/steering/ship-feature.md` | `/ship-feature`: build one feature end to end in small verified steps |
| `.kiro/steering/demo-ready.md` | `/demo-ready`: pre-submission checklist and pitch draft |
| `.kiro/specs/app-baseline/` | Spec for this baseline: requirements, design, tasks |
| `.kiro/hooks/` | Agent hooks: lint on save, type-check when the agent finishes, block `.env` access |

For a new feature, open the Kiro panel and create a spec (**Specs → +**), or run `/ship-feature` in chat for something small.

## Project structure

See [`.kiro/steering/structure.md`](.kiro/steering/structure.md). Stack and rules are in [`.kiro/steering/tech.md`](.kiro/steering/tech.md).
