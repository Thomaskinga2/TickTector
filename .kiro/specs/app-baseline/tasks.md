# Implementation Plan

- [x] 1. Scaffold the Next.js project
  - Create the app with `create-next-app` (TypeScript, App Router, Tailwind, ESLint) and remove the template content
  - Add the `typecheck` script and set `agentRules: false` in `next.config.ts`
  - _Requirements: 5.1_

- [x] 2. Theme and layout
- [x] 2.1 Define ink-and-paper theme tokens
  - Light and dark CSS variables in `app/globals.css`, mapped to Tailwind colors with `@theme inline`
  - Theme the selection color, caret and focus outline from the tokens
  - _Requirements: 1.3, 1.4, 2.6_

- [x] 2.2 Set up the root layout
  - Load Geist and Instrument Serif with `next/font/google`; set the page title and description
  - _Requirements: 1.1_

- [x] 3. Server-side API
- [x] 3.1 Add server-only settings in `lib/env.ts`
  - `apiBaseUrl()` and `apiKey()` read `API_URL` / `API_KEY`, trimmed, with null for unset values
  - _Requirements: 4.1_

- [x] 3.2 Implement `GET /api/ping`
  - `await connection()` so the route runs per request
  - Mock response after ~800 ms when `API_URL` is unset
  - Forward to `{API_URL}/health` with an 8 s timeout and an optional Bearer `API_KEY`
  - Map upstream failures to 502 `{ error }` with short messages
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.2, 4.3_

- [x] 4. Browser client and UI
- [x] 4.1 Implement `lib/api.ts`
  - `request<T>()` with a 10 s timeout and readable `ApiError` messages; typed `ping()`
  - _Requirements: 2.1, 2.4_

- [x] 4.2 Build `PingButton`
  - idle / loading / success / error states, `aria-busy`, disabled while loading, "Try again" after an error
  - `aria-live` Result_Line colored by outcome
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4.3 Build the home page
  - Title, tagline, `PingButton`, decorative accent disc, and footer with the Mock_Mode / live indicator
  - Responsive grid that groups the content on phones
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 5. Configuration and docs
  - `.env.example` with `API_URL` and `API_KEY`; `.gitignore` ignores `.env*` except `.env.example`
  - README with setup, scripts and Vercel deploy notes
  - _Requirements: 4.4, 5.2_

- [x] 6. Checkpoint: verify the baseline
  - `npm run typecheck`, `npm run lint` and `npm run build` pass, and `/api/ping` builds as dynamic
  - Click through mock mode at phone and desktop widths in light and dark mode
  - _Requirements: 1.2, 1.3, 2.3, 5.1_

- [ ]* 7. Automated tests
- [ ]* 7.1 Unit-test `request()` error mapping
  - Network error, timeout, non-2xx with and without an `{ error }` body
  - _Requirements: 2.4_

- [ ]* 7.2 Unit-test the Ping_Route branches
  - Mock_Mode, upstream success, upstream non-2xx, upstream timeout
  - _Requirements: 3.1, 3.2, 3.3_
