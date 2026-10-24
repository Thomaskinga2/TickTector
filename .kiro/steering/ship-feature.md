---
inclusion: manual
---

# Ship a feature (hackathon loop)

Run with `/ship-feature` in chat. Goal: a working, demo-able feature as fast as possible, never leaving `main` broken.

## Steps
1. **Re-read context:** `.kiro/steering/product.md` (the ONE demo flow and the out-of-scope list) and the current `tasks.md` under `.kiro/specs/` if there is one. If the request is out of scope, say so and suggest the smallest in-scope alternative.
2. **Plan in 3–5 lines:** files to touch, data shape, and what "done" looks like in the browser. For anything bigger than an afternoon, create a spec instead (Specs → +).
3. **Build the thinnest vertical slice:** UI → route handler → upstream/AI call → rendered result. Hard-code or mock whatever isn't essential.
4. **AI calls (if any):**
   - Put the client and prompt in `lib/ai.ts`; ask for JSON only and validate its shape before rendering.
   - Add a loading state, a friendly error message and a ~30 s timeout.
   - Add a demo fallback in `lib/demo-data.ts` and use it when the call fails or when `?demo=1` is in the URL.
5. **Verify:** `npm run build` passes with no errors. Open the page and run the flow with a sample from `public/samples/`.
6. **Polish what judges see:** empty state, loading state, phone width, light and dark mode, no console errors.
7. **Commit** with a clear message, e.g. `feat: upload and analyze prescription photo`.
8. **Report** in 2–3 lines: what works now, what is mocked, and the next suggested step.

## Rules
- If the same approach fails twice, stop and propose a simpler path.
- No new dependencies without asking, and only if they save more than 30 minutes.
- Never commit `.env.local` or API keys.
