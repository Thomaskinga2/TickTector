# Implementation Plan

- [x] 1. Server
- [x] 1.1 `townAt()` in `lib/providers/geocoding.ts`; `/api/towns/nearest` uses it
  - _Requirements: 1.2_
- [x] 1.2 `GET /api/towns/approximate` from Vercel IP headers (404 without them, 422 outside MA)
  - _Requirements: 2.1, 2.4_

- [x] 2. Client
- [x] 2.1 `findApproximateTown()` in `lib/services/towns.ts`
  - _Requirements: 2.1_
- [x] 2.2 `lib/use-near-me.ts`: ask on first load, IP town meanwhile, precise wins
  - _Requirements: 1.1, 2.3, 2.5_
- [x] 2.3 "Near you" section in `components/town-browser.tsx`; remove `LocationButton`; `features.geolocation = true`
  - _Requirements: 1.2, 1.3, 2.2_

- [ ] 3. Verify on a Vercel preview deploy (IP headers only exist there)
  - _Requirements: 2.1, 2.2_
