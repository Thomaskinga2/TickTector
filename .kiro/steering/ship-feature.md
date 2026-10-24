---
inclusion: manual
---

# Ship a feature (hackathon loop)

Run with `/ship-feature` in chat. Goal: a working, demo-able feature as fast as possible, never leaving `main` broken.

## Steps
1. **Re-read context:** `.kiro/steering/product.md` (the ONE demo flow and the out-of-scope list), the feature slot table in `TEAM.md`, and the current `tasks.md` under `.kiro/specs/` if there is one. If the request is out of scope, say so and suggest the smallest in-scope alternative.
2. **Branch:** `git checkout main && git pull`, then `git checkout -b <role>/<feature>` (`ui/*`, `be-risk/*` or `be-species/*`).
3. **Plan in 3–5 lines:** files to touch, the data shape in `lib/types.ts`, and what "done" looks like in the browser. For anything bigger than an afternoon, create a spec instead (Specs → +).
4. **Build the thinnest vertical slice** along the wiring: API route (mock first) → service in `lib/services/` → component → page. Flip the flag in `lib/features.ts` when the real component is ready.
5. **AI calls (scan feature):**
   - Call the vision model only from `app/api/scan/route.ts`; ask for JSON and validate it with a zod schema matching `ScanResult`.
   - Use a ~30 s timeout. The UI shows loading and errors through `useAsync` and `components/states.tsx`.
   - Fall back to `SCAN_RESULT` from `lib/mock-data.ts` when the call fails or `DEMO_MODE=1`.
6. **Verify:** `npm run build` passes with no errors. Open the page at phone width and run the flow, once normally and once with `DEMO_MODE=1`.
7. **Polish what judges see:** empty state, loading state, phone width, no console errors.
8. **Ship:** commit with a clear message (e.g. `feat: weekly risk from real data`), `git push -u origin <branch>`, then `gh pr create --fill`. A teammate reviews and merges; Vercel deploys `main`.
9. **Report** in 2–3 lines: what works now, what is still mocked, and the next suggested step.

## Rules
- If the same approach fails twice, stop and propose a simpler path.
- No new dependencies unless they save more than 30 minutes; tell the team first.
- Never commit `.env.local` or API keys. Never push or force-push `main`.
