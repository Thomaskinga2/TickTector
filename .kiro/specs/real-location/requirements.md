# Requirements Document

## Introduction

TikTector finds a user's town in two ways: searching by name and "Use my location". Both currently run on a mock geocoding provider that knows three towns and answers "Amherst" for any coordinates. This feature replaces the mock with a real provider and a complete list of Massachusetts towns, then turns on the `geolocation` feature flag. Owner: Backend 1 (see `TEAM.md`).

## Glossary

- **App**: the TikTector Next.js web application.
- **Town**: a Massachusetts city or town, shaped as `Town` in `lib/types.ts`.
- **Town_List**: the complete list of Massachusetts towns stored in `data/`.
- **Geocoding_Provider**: the implementation of `GeocodingProvider` in `lib/providers/geocoding.ts`, selected by `GEOCODING_PROVIDER`.
- **Town_Search**: the `TownSearch` component and `GET /api/towns?q=`.
- **Nearest_Town_Route**: `GET /api/towns/nearest?lat=&lng=`.

## Requirements

### Requirement 1: Search every Massachusetts town

**User Story:** As a resident of any Massachusetts town, I want to find my town by typing part of its name, so that I can see its tick risk.

#### Acceptance Criteria

1. WHEN the user types at least 1 character, THE Town_Search SHALL return matching Towns from the Town_List, ordered with name-prefix matches first, limited to 8 results.
2. THE Town_Search SHALL return only Towns in Massachusetts.
3. WHEN no Town matches, THE Town_Search SHALL show an empty state that names the search text.
4. THE `TownSelect` component SHALL list every Town in the Town_List in alphabetical order.

### Requirement 2: Nearest town from the browser location

**User Story:** As a user on a trail, I want to tap "Use my location" and land on my town's page, so that I don't have to type.

#### Acceptance Criteria

1. WHEN the Nearest_Town_Route receives coordinates inside Massachusetts, THE Nearest_Town_Route SHALL return the Town from the Town_List whose center is closest to those coordinates.
2. IF the coordinates are outside Massachusetts, THEN THE Nearest_Town_Route SHALL respond with status 422 and the message "TikTector covers Massachusetts only".
3. IF the coordinates are missing or not numbers, THEN THE Nearest_Town_Route SHALL respond with status 400.
4. WHEN the `geolocation` flag in `lib/features.ts` is true, THE App SHALL show a working "Use my location" button on the home page and the new post form.
5. IF the browser denies location access or times out, THEN THE App SHALL show a message and move focus to the town search input.

### Requirement 3: Pluggable real provider with a safe fallback

**User Story:** As a teammate, I want the real geocoding provider behind an env var, so that the demo keeps working if the provider is down.

#### Acceptance Criteria

1. WHERE `GEOCODING_PROVIDER` names an implemented provider, THE Geocoding_Provider SHALL use it, reading any key from the server-only `GEOCODING_API_KEY`.
2. WHILE `DEMO_MODE=1`, THE App SHALL use the mock Geocoding_Provider.
3. IF the real provider fails or takes longer than 8 seconds, THEN THE route SHALL fall back to the Town_List lookup instead of returning an error.
4. THE App SHALL never send the geocoding key to the browser.

### Requirement 4: Real town names on the town page

**User Story:** As a user, I want the town page to show the town's real name and county, so that I know I'm looking at the right place.

#### Acceptance Criteria

1. WHEN the user opens `/area/[town]` for a Town in the Town_List, THE App SHALL show the Town's name and county as the page heading.
2. IF the town id is not in the Town_List, THEN THE App SHALL show a not-found message with a link back to search.
