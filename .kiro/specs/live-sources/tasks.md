# Implementation Plan

- [x] 1. Verify bundled data and facts
- [x] 1.1 Compare all 104 rows of `data/massgov/syndromic_county.csv` with Table 1 of the 8 DPH reports (exact match)
  - _Requirements: 1.2_
- [x] 1.2 Check species and prevention text against Mass. DPH and CDC pages; fix seasons, lone star diseases, permethrin and DEET wording; drop the unsourced danger rating
  - _Requirements: 2.2_

- [x] 2. Live sources
- [x] 2.1 `lib/providers/dph.ts` with validation, cache and bundled fallback
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
- [x] 2.2 NWS update time in the forecast basis
  - _Requirements: 2.1_
- [x] 2.3 Census Geocoder provider (default) with nearest-town fallback
  - _Requirements: 3.1, 3.2_

- [x] 3. Citations in the UI and docs
- [x] 3.1 "Why this level": exact report and table, all-county label, checked/updated times, rule marked as ours
  - _Requirements: 2.1, 2.3_
- [x] 3.2 Source lists under species and prevention modules
  - _Requirements: 2.2_
- [x] 3.3 "Did you know?" module: cited DPH facts plus three computed from the live DPH report (`/api/facts`, `lib/providers/facts.ts`, `components/fun-facts.tsx`), one per day by the device date
  - _Requirements: 2.2_
- [x] 3.4 README sources (government only, dead CDC link replaced), steering docs, `.env.example`
