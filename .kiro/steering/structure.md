---
inclusion: always
---

# Project structure

```
app/                   Routes (App Router)
  layout.tsx           Root layout: fonts, metadata, body
  page.tsx             Home page (the main demo flow; one page is fine)
  globals.css          Tailwind import and theme tokens (light + dark)
  api/ping/route.ts    Example route handler: forwards to API_URL or mocks
components/            UI pieces, named by what the user sees
  ping-button.tsx      Client component: calls the API, shows loading/success/error
lib/
  api.ts               Browser-side client for our own /api routes
  env.ts               Server-only settings (API_URL, API_KEY)
public/                Static files served from /
.kiro/
  steering/            Always-on, file-matched and manual (/slash) guidance
  specs/               One folder per feature: requirements, design, tasks
  hooks/               Agent hooks (JSON, v1 schema) and their scripts
```

Add these only when a feature needs them:

```
app/api/<name>/route.ts   One route per server capability, e.g. api/analyze
lib/ai.ts                 Single place for the AI client and prompts
lib/demo-data.ts          Cached example responses (demo fallback)
public/samples/           Sample inputs for the live demo (images, PDFs)
```

## Conventions
- File names use **kebab-case**: `ping-button.tsx`, `demo-data.ts`.
- Components use **PascalCase** named exports named by what the user sees: `ResultCard`, `UploadBox`.
- Route files (`page.tsx`, `layout.tsx`, `route.ts`) use the exports Next.js requires: default exports for pages and layouts, named HTTP methods for routes.
- Import with the `@/` alias from the project root, for example `@/components/ping-button`.
- `lib/env.ts` and `lib/ai.ts` are server-only. Client code calls our routes through `lib/api.ts`.
- One prompt per feature, stored as a constant in `lib/ai.ts`.
- Keep everything the judges see polished; keep internals simple.
