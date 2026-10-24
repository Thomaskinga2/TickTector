# Implementation Plan

- [x] 1. Matching
- [x] 1.1 `matchTowns()` in `components/map-utils.ts` over the bundled town list
  - _Requirements: 1.1, 1.2_

- [x] 2. Search UI
- [x] 2.1 `components/map-town-search.tsx`: Home-style field, results with face, county and level, empty message
  - _Requirements: 1.1, 1.3, 1.4, 3.1, 3.3_
- [x] 2.2 Combobox keyboard: Up/Down, Return, Escape
  - _Requirements: 3.2_

- [x] 3. Map page
- [x] 3.1 Place the search above the level filter; picking switches a hiding filter to All, selects the town, clears the search
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Verify at 393 and 320 pt wide: fit, pick a town, keyboard
  - _Requirements: 2.1, 3.1, 3.2_

- [x] 5. Fix: picking a result with a tap on a phone also tapped the level filter beneath the list (the pick ran on pointer down and closed the list under the finger); pick on click instead
  - _Requirements: 2.1_
