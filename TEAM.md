# Team workflow

4 people, one repo, `main` auto-deploys to Vercel. Rule #1: **never push a broken `main`.**

## Who owns what

| Role | Owns (edit freely) | Don't touch without asking |
|---|---|---|
| **Lead** | `.kiro/` (steering, specs, hooks), merging to `main`, Vercel env vars | — |
| **UI** | `app/page.tsx`, `app/**/page.tsx`, `components/`, `app/globals.css`, `public/` | `lib/ai.ts`, `app/api/` |
| **Backend 1: AI** | `lib/ai.ts` (prompts, model call), `app/api/analyze/` | `components/` |
| **Backend 2: data & extra APIs** | `lib/demo-data.ts`, `lib/data/`, new `app/api/<name>/` routes | `components/` |

**Shared contract: `lib/schema.ts`.** It defines what the API returns and what the UI renders.
Changing it breaks the other side, so post in the team chat first, then change schema + demo data + UI in one commit.

## How the pieces connect

```
UI (app/page.tsx) --postAnalyze()--> lib/api.ts --POST--> app/api/analyze/route.ts --> lib/ai.ts --> Claude
                                                                   |
                                                    on error / no key --> lib/demo-data.ts
```

- UI can work **without an API key**: set `DEMO_MODE=1` in `.env.local` and the API always returns demo data.
- Response shape is always `{ result, demo }`; `demo: true` means the fallback was served.

## Adding a new endpoint (backend)

1. Add input/output zod schemas to `lib/schema.ts`.
2. Add a demo response to `lib/demo-data.ts`.
3. Copy `app/api/analyze/route.ts` to `app/api/<name>/route.ts` and swap the call.
4. Add a `post<Name>()` helper to `lib/api.ts` so UI never writes `fetch` by hand.

## Git

```bash
git checkout main && git pull
git checkout -b ui/result-card        # ui/..., be/..., lead/...
# ...work...
npm run build                         # must pass
git commit -m "feat: result card"     # English, small commits
git checkout main && git pull && git merge ui/result-card && git push
```

- Pull `main` at least every hour; merge small and often (every 30–60 min).
- Merge conflict in a file you don't own → ask its owner, don't guess.

## Setup

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY, or set DEMO_MODE=1
npm run dev
```
