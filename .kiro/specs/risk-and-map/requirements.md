# Requirements Document

## Introduction

The weekly risk gauge and the risk map are the heart of the TikTector demo. Today `GET /api/risk` and `GET /api/heatmap` return hand-written mock rows for a few towns, and the map is a placeholder grid behind the `heatmap` feature flag. This feature computes risk from real data for every Massachusetts town and shows it on a real map. Owner: Backend 1 (see `TEAM.md`). The data sources are chosen in the design phase.

## Glossary

- **App**: the TikTector Next.js web application.
- **Weekly_Risk**: the `WeeklyRisk` shape in `lib/types.ts`: a level (`low`, `moderate`, `high`) and a one-line reason for one town and one week.
- **Risk_Route**: `GET /api/risk?town=`.
- **Heatmap_Route**: `GET /api/heatmap`.
- **Risk_Map**: the `Heatmap` component on `/map` and its preview on the town page.

## Requirements

### Requirement 1: Weekly risk from real data

**User Story:** As a student about to go for a run, I want this week's tick risk for my town, so that I know how careful to be today.

#### Acceptance Criteria

1. WHEN the Risk_Route receives a valid town id, THE Risk_Route SHALL return a Weekly_Risk computed from real data sources for the current week.
2. THE Weekly_Risk reason SHALL be one plain-English sentence of at most 120 characters that names the main factor (for example season or recent temperatures).
3. THE Risk_Route SHALL return the same level for the same town and week on repeated calls.
4. IF the town id is unknown, THEN THE Risk_Route SHALL respond with status 404.
5. IF a data source fails, THEN THE Risk_Route SHALL return the mock Weekly_Risk instead of an error.

### Requirement 2: Risk values for the whole state

**User Story:** As a judge, I want to see tick risk across all of Massachusetts at a glance, so that I understand the problem's scale.

#### Acceptance Criteria

1. THE Heatmap_Route SHALL return one point per Massachusetts town with a value from 0 to 1.
2. THE Heatmap_Route values SHALL be consistent with the Weekly_Risk levels returned by the Risk_Route for the same week.
3. WHEN the Heatmap_Route serves live data, THE Heatmap_Route SHALL run per request rather than being prerendered at build time.

### Requirement 3: Real map

**User Story:** As a user, I want a real map of Massachusetts with risk shown by town, so that I can compare places I'm going to.

#### Acceptance Criteria

1. WHEN the `heatmap` flag in `lib/features.ts` is true, THE Risk_Map SHALL render a pannable, zoomable map of Massachusetts with each town's risk shown in the theme's risk colors.
2. WHEN the user taps a town on the Risk_Map, THE App SHALL show the town's name and risk level with a link to its town page.
3. THE Risk_Map SHALL fill the screen on `/map` and fit a 16:10 preview on the town page at 375 px width.
4. WHILE map tiles are loading, THE Risk_Map SHALL show the loading state from `components/states.tsx`.

### Requirement 4: Demo safety

**User Story:** As the presenter, I want risk and map to work even if a data source is down, so that the live demo never breaks.

#### Acceptance Criteria

1. WHILE `DEMO_MODE=1`, THE Risk_Route and Heatmap_Route SHALL return mock data.
2. THE Risk_Route and Heatmap_Route SHALL call external sources with a timeout of about 8 seconds.
