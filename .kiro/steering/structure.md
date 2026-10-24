# Structure

```
app/                 Routes (App Router)
  layout.tsx         Root layout: fonts, metadata, body
  page.tsx           Home page
  globals.css        Tailwind import and theme tokens (light + dark)
  api/ping/route.ts  Example route handler (forwards to API_URL or mocks)
components/          Reusable UI components
  ping-button.tsx    Client component: calls the API, shows loading/success/error
lib/                 Helpers
  api.ts             Browser-side client for our /api routes
  env.ts             Server-only settings (API_URL, API_KEY)
public/              Static files served from /
.kiro/               Kiro steering and specs (committed)
```

## Conventions
- File names use **kebab-case**: `ping-button.tsx`, `env.ts`.
- Components use **PascalCase** named exports: `export function PingButton()`.
- Route files (`page.tsx`, `layout.tsx`, `route.ts`) use the exports Next.js requires (default export for pages and layouts, named HTTP methods for routes).
- Import with the `@/` alias from the project root, for example `@/components/ping-button`.
- Keep `lib/env.ts` out of client components. Client code goes through `lib/api.ts`.
- New API endpoints go in `app/api/<name>/route.ts` with a matching function in `lib/api.ts`.
