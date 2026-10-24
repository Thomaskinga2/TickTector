---
inclusion: fileMatch
fileMatchPattern: "app/api/**/*"
---

# Route handler conventions

`app/api/ping/route.ts` is the reference implementation. Copy its shape for new routes.

## Shape of a route
1. Call `await connection()` from `next/server` first when the response must be computed per request. `cacheComponents` is on, so a GET handler that touches no request data is otherwise prerendered at build time and every visitor gets the same frozen response.
2. Read settings through `lib/env.ts` (`apiBaseUrl()`, `apiKey()`), never `process.env` scattered across files.
3. If the upstream isn't configured, return the demo fallback (mock or `lib/demo-data.ts`) with the **same response shape** as the real one, so the UI never branches on mock vs. live.
4. Call the upstream with `AbortSignal.timeout(...)`: 8 s for plain APIs, about 30 s for AI calls.
5. Return JSON only:
   - success: `Response.json({ ...data, source: 'api' | 'mock' })`
   - failure: `Response.json({ error: '<what went wrong and what to do>' }, { status: 502 })` for upstream problems, `400` for bad input

## Client side
- Add a typed function per route in `lib/api.ts` (like `ping()`), which goes through `request<T>()` so timeouts and error messages are handled in one place.
- Components never call `fetch` directly.

## Don't
- Don't put keys in `NEXT_PUBLIC_*` variables or return them in responses.
- Don't forward raw upstream errors or stack traces to the browser. Map them to a short message the user can act on.
- Don't add a `route.ts` next to a `page.tsx` in the same folder; Next.js doesn't allow both.
