# Requirements Document

## Introduction

The risk map shows this week's tick risk for every tracked Massachusetts town on a real, friendly map. It replaces the "Coming soon" placeholder on `/map` and the small map preview on each town page. It reads the existing `GET /api/heatmap` contract (`HeatmapPoint[]`, value 0..1) and links each town to its area page.

## Glossary

- **Risk_Map**: the interactive map on `/map`.
- **Map_Preview**: the small, non-interactive map on `/area/[town]`.
- **Town_Pin**: the marker for one `HeatmapPoint`.
- **Risk_Index**: a point's `value`, mapped to a level: high ≥ 0.70, moderate ≥ 0.40, otherwise low.
- **Town_Card**: the panel under the Risk_Map that describes the selected town.
- **Town_List**: the list of all towns under the Risk_Map, highest risk first.

## Requirements

### Requirement 1: See risk across Massachusetts

**User Story:** As someone planning a walk, I want to see which towns have high tick risk this week, so that I know where to take extra care.

#### Acceptance Criteria

1. WHEN a visitor opens `/map`, THE Risk_Map SHALL show Massachusetts with one Town_Pin per heatmap point, colored by its Risk_Index level.
2. THE Risk_Map SHALL show a legend for the low, moderate and high colors.
3. WHILE the map is zoomed out to the whole state, THE Town_Pins SHALL show as dots; WHEN the visitor zooms in to town level, THE Town_Pins SHALL show town names.
4. THE Risk_Map SHALL support pan and pinch-zoom and SHALL keep the view near Massachusetts.
5. WHILE the heatmap data is loading, THE page SHALL show a loading state; IF it fails, THEN THE page SHALL show the error with a "Try again" action.

### Requirement 2: Look up one town

**User Story:** As a visitor, I want to tap a town and see why its risk is what it is, so that I can decide what to do.

#### Acceptance Criteria

1. WHEN the visitor taps a Town_Pin, THE Risk_Map SHALL highlight that pin and center the map on it.
2. WHEN a town is selected, THE Town_Card SHALL show the town name, its risk level and this week's reason from `GET /api/risk`, plus a link to `/area/<town>`.
3. WHILE no town is selected, THE Town_Card SHALL invite the visitor to tap a town.
4. WHEN the visitor closes the Town_Card, THE Risk_Map SHALL clear the selection.

### Requirement 3: Filter by risk level

**User Story:** As a visitor, I want to show only high-risk towns, so that the map is easier to read.

#### Acceptance Criteria

1. THE page SHALL offer All, High, Moderate and Low filters, each with its town count.
2. WHEN a filter is chosen, THE Risk_Map and the Town_List SHALL show only towns at that level.
3. IF the selected town is hidden by a filter, THEN THE Town_Card SHALL clear the selection.

### Requirement 4: Accessible without the map

**User Story:** As a screen reader or keyboard user, I want the same information without using the map, so that I'm not left out.

#### Acceptance Criteria

1. THE Town_List SHALL list every visible town with its level, highest Risk_Index first, each linking to its area page.
2. THE Town_Pins SHALL be reachable by keyboard and SHALL have an accessible name that includes the town and its level.
3. THE filters SHALL be buttons that expose their pressed state.
4. WHERE the visitor prefers reduced motion, THE Risk_Map SHALL move without animation.

### Requirement 5: Map preview on town pages

**User Story:** As a visitor on a town page, I want a small map that opens the full one, so that I can compare nearby towns.

#### Acceptance Criteria

1. THE Map_Preview SHALL show all Town_Pins as dots and SHALL NOT pan, zoom or open popups.
2. WHEN the visitor taps the Map_Preview, THE App SHALL open `/map`.

### Requirement 6: Fits the demo constraints

**User Story:** As the team, I want the map to work in the live demo, so that it never breaks on stage.

#### Acceptance Criteria

1. THE Risk_Map SHALL render only in the browser and SHALL NOT break the server render or `npm run build`.
2. THE map SHALL credit its tile provider (Esri and its data sources) on screen.
3. WHEN `features.heatmap` is false, THE pages SHALL keep showing "Coming soon".
