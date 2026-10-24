# Requirements Document

## Introduction

TickTector gives every Massachusetts city and town a weekly tick risk level and shows all of them on a map TickTector draws itself. Levels come only from published data: Mass. DPH tick-borne disease surveillance (by county, the finest level DPH publishes) and the National Weather Service forecast. The map is drawn from US Census boundaries with no tile server or third-party map service.

## Glossary

- **County group**: a DPH reporting area. Dukes and Nantucket are reported together as "Dukes & Nantucket", so there are 13 groups for 14 counties.
- **Ratio**: a county group's tick-borne disease ER visits per 10,000 ER visits, divided by the rate for all counties combined.
- **Basis**: the numbers and sources behind a level (county and state rates, report period, forecast highs, links).

## Requirements

### Requirement 1: Weekly risk for every town from real data

**User Story:** As a Massachusetts resident, I want this week's tick risk for my town, so I know how careful to be outside.

#### Acceptance Criteria

1. The system SHALL set each county group's baseline from the DPH ratio: High WHEN the ratio is 1.5 or more, Moderate WHEN it is 0.75 or more, otherwise Low.
2. IF no daytime high in the 7-day NWS forecast is above 32 °F THEN the level SHALL be Low, AND the town page SHALL show the DPH and NWS numbers behind the level with links to both sources.
3. The system SHALL cache each forecast for one hour, so repeated requests in that window give the same level and reason.
4. The system SHALL answer for each of the 351 Census cities and towns, each taking its county group's level and basis, AND SHALL answer 404 for any other town id.
5. Each level SHALL come with one plain sentence: how the county's tick-borne disease ER visits compare with the Massachusetts average, and whether it is warm enough for ticks this week (or that it stays at or below freezing).

### Requirement 2: Map data

**User Story:** As a resident, I want the map to show the same levels as the rest of the app.

#### Acceptance Criteria

1. `GET /api/heatmap` SHALL return exactly one point per Census city and town (351), AND `GET /api/risk/counties` SHALL return all 13 county groups for the map page's county ranking.
2. A town's map value SHALL map back to the same level as `GET /api/risk` for that town.
3. The risk and map routes SHALL be computed per request, not frozen at build time.

### Requirement 3: TickTector's own vector map

**User Story:** As a resident, I want a map of Massachusetts I can explore without a third-party map service.

#### Acceptance Criteria

1. The map SHALL draw the state, county and town boundaries from US Census cartographic boundary files bundled with the app, shading each town by its level, with no tile server, map API or key.
2. WHEN the visitor taps a town THEN the map SHALL move to it, mark it, and open its card; the level filter SHALL change the shading in place; panning SHALL be held to Massachusetts; the map SHALL provide its own zoom and "show all of Massachusetts" controls.
3. The map SHALL label county names when zoomed out (below zoom 9.25) and town names when zoomed in (from zoom 10), only within the view.
4. WHILE the basemap loads THEN the map SHALL show a loading state, AND IF it fails THEN it SHALL say the map couldn't load and offer "Try again".

### Requirement 4: Working when the forecast doesn't

**User Story:** As a resident, I want a level even when the weather service is down.

#### Acceptance Criteria

1. IF the NWS forecast fails or takes longer than 8 seconds THEN the system SHALL give the level from the DPH baseline alone AND the reason SHALL say there is no forecast right now.
2. WHEN `DEMO_MODE=1` THEN the system SHALL behave as in 4.1 without calling NWS, so the demo works offline.

## Product owner decision: nothing invented

The site shows no invented data: no mock towns, levels, map points, scan results or seeded forum posts. Where data is missing, the app says so.
