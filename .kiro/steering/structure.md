---
inclusion: always
---

# Project structure

```
app/
  page.tsx              # landing + the main demo flow (one page is fine)
  result/page.tsx       # result view (optional)
  api/analyze/route.ts  # server route that calls the AI
components/             # UI pieces (shadcn/ui in components/ui)
lib/
  ai.ts                 # single place for AI client + prompts
  schema.ts             # zod schemas for AI JSON output
  demo-data.ts          # cached example responses (demo fallback)
public/samples/         # sample inputs for the live demo (images, PDFs)
```

## Conventions
- One prompt per feature, stored as a constant in `lib/ai.ts`.
- Components are small and named by what the user sees (`ResultCard`, `UploadBox`).
- Keep everything the judges see polished; keep internals simple.
