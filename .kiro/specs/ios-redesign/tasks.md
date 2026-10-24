# Implementation Plan

- [x] 1. Design tokens and materials
- [x] 1.1 iOS system colors (light/dark), hemlock tint, risk palette and level gradients in `app/globals.css`
  - _Requirements: 1.4, 5.1, 5.4, 5.5_
- [x] 1.2 iOS text styles, system font, glass and material classes, motion easings, accessibility fallbacks
  - _Requirements: 1.5, 5.2, 5.3, 6.2_

- [x] 2. App chrome
- [x] 2.1 Floating glass tab bar
  - _Requirements: 1.1, 1.6_
- [x] 2.2 `Page` with large title, collapsing glass nav bar and back button; `Section`
  - _Requirements: 1.2, 1.3_
- [x] 2.3 Layout: viewport, theme colors for light/dark, safe areas
  - _Requirements: 5.1, 7.1_

- [x] 3. Shared controls
- [x] 3.1 Buttons, grouped lists, segmented control
  - _Requirements: 1.6, 4.1_
- [x] 3.2 `LevelGlyph`, `RiskBadge`, states and content-unavailable view
  - _Requirements: 4.3, 5.4_

- [x] 4. Town page (signature)
- [x] 4.1 `RiskBackdrop`, `RiskReadout` with week range and device clock
  - _Requirements: 2.1, 2.5, 2.6_
- [x] 4.2 Modules: what to do, ticks, sightings nearby, focused map
  - _Requirements: 2.3, 2.4_
- [x] 4.3 Signature motion: readout settle, glyph fill, backdrop cross-fade (row-to-page morph cut, see design.md Direction)
  - _Requirements: 6.1, 5.3_

- [x] 5. Home town list with search
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Map, forum, scan and quest in iOS grammar
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Checkpoint: typecheck, lint, build; batched screenshots light/dark/desktop; fix; confirm
  - _Requirements: 7.4_

- [x] 8. Finish-review fixes
- [x] 8.1 Focused map: mirror the frame around the town, 80px side padding, attribution inset bottom-left
  - _Requirements: 2.4_
- [x] 8.2 Module headers in sentence case (subhead semibold); drop the alert title that repeats the level
  - _Requirements: 2.3_
- [x] 8.3 Species disease risk as plain text, never the level glyph
  - _Requirements: 5.4_
- [x] 8.4 Scroll-edge nav bars (level-tinted on town pages); on-sky tab bar on town pages
  - _Requirements: 1.2, 1.4_
- [x] 8.5 Home: two-line reasons and the disclaimer
  - _Requirements: 3.1_
- [x] 8.6 New Sighting as a sheet: grabber, no tab bar, Post disabled until required fields are filled
  - _Requirements: 1.1, 4.1_
- [x] 8.7 Scan's unavailable view centered like Quest's
  - _Requirements: 4.3_
