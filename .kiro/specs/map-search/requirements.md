# Requirements Document

## Introduction

The Risk Map shows all 351 Massachusetts cities and towns, but finding one meant panning and zooming until you spotted it. A search bar above the map finds a town by name and takes the map straight to it.

## Requirements

### Requirement 1: Find a town by name

**User Story:** As a resident, I want to type my town's name on the map, so I can see its risk without hunting for it.

#### Acceptance Criteria

1. WHEN the visitor types in the map's search bar THEN the system SHALL list up to 6 cities and towns whose name starts with the text or has a word starting with it, each with its county and this week's level.
2. The search SHALL use the bundled list of 351 towns (`lib/data/ma-towns.json`), so results appear without a network request.
3. IF nothing matches THEN the system SHALL say no Massachusetts city or town matches.
4. WHEN the search text is empty THEN the system SHALL show no list.

### Requirement 2: Go to the town

**User Story:** As a resident, I want picking a result to show me that town on the map.

#### Acceptance Criteria

1. WHEN the visitor picks a result (tap, or Return for the top match) THEN the system SHALL select that town: the map moves to it, its pin shows, and its card opens below the map.
2. IF the current level filter hides the picked town THEN the system SHALL switch the filter to All before selecting it.
3. WHEN a town is picked THEN the system SHALL clear the search text and close the list.

### Requirement 3: Accessible and phone-friendly

**User Story:** As a phone or keyboard user, I want the search to work like a native search field.

#### Acceptance Criteria

1. The search bar SHALL match Home's search field (44 pt tall, rounded, clear button) and fit a 320 pt-wide screen.
2. The field SHALL be a combobox: Up and Down move through results, Return picks, Escape clears.
3. Each result SHALL state its level in words, never by color alone.
