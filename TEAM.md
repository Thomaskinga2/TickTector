# Team workflow

4 people, one repo, `main` auto-deploys to Vercel. Rule #1: **never push a broken `main`.**

## How a feature is wired

```
page (app/) -> component (components/) -> service (lib/services/) -> API route (app/api/) -> provider / mock (lib/providers/, lib/mock-data.ts)
```

- Pages call **service functions only**, never mock data. To use real data, change the API route or provider; the UI stays the same.
- Shared types live in `lib/types.ts`. Changing a type breaks the other side, so tell the team first.
- `lib/features.ts` hides unfinished features behind "Coming soon". Flip a flag to `true` to show the real component.
- Search for `TODO` to find every slot that still returns mock data.

## Who owns what

| Role | Owns (edit freely) | Don't touch without asking |
|---|---|---|
| **Lead** | `.kiro/`, `lib/features.ts`, merging to `main`, Vercel env vars | — |
| **UI** | `app/**/page.tsx`, `components/`, `app/globals.css`, `public/` | `app/api/`, `lib/providers/` |
| **Backend 1: location & risk** | `app/api/towns`, `app/api/risk`, `app/api/species`, `app/api/alerts`, `lib/providers/geocoding.ts` | `components/` |
| **Backend 2: map, scan, forum** | `app/api/heatmap`, `app/api/scan`, `app/api/forum`, `lib/providers/forum-store.ts`, `data/` | `components/` |

`lib/mock-data.ts` and `lib/types.ts` are shared: small commits, post in chat when you change them.

## Adding an endpoint

1. Add the type to `lib/types.ts` and a mock to `lib/mock-data.ts`.
2. Add `app/api/<name>/route.ts`: validate input, return mock, leave a `// TODO`.
3. Add a service function in `lib/services/` that calls the route via `getJson()`.
4. In the component, use `useAsync()` and spread the loading/error props: `<X data={data} {...slot} />`.

## Git

```bash
git checkout main && git pull
git checkout -b ui/risk-gauge        # ui/..., be/..., lead/...
# ...work...
npm run build                        # must pass
git commit -m "feat: risk gauge"     # English, small commits
git checkout main && git pull && git merge ui/risk-gauge && git push
```

- Pull `main` at least every hour; merge small and often.
- Merge conflict in a file you don't own → ask its owner, don't guess.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```
