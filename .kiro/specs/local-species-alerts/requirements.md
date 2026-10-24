# Requirements Document

## Introduction

The town page lists tick species and prevention steps. Today `GET /api/species` returns the same three species for every town, and `GET /api/alerts` returns fixed steps per risk level. This feature makes both local and seasonal. Owner: Backend 2 (see `TEAM.md`).

## Glossary

- **App**: the TikTector Next.js web application.
- **Species_Route**: `GET /api/species?town=`, returning `TickSpecies[]` from `lib/types.ts`.
- **Alerts_Route**: `GET /api/alerts?level=`, returning `ActionAlert[]` from `lib/types.ts`.

## Requirements

### Requirement 1: Species found in the town

**User Story:** As a user, I want to see only the ticks that live in my area, so that I'm not worried about species that aren't there.

#### Acceptance Criteria

1. WHEN the Species_Route receives a valid town id, THE Species_Route SHALL return only species recorded in that town's county, from a documented data source.
2. THE Species_Route SHALL order species by danger level, highest first.
3. THE Species_Route SHALL list for each species the diseases it can carry and its active season.
4. IF no species are recorded for the town, THEN THE App SHALL show the empty state "No tick species recorded here yet."

### Requirement 2: Seasonal prevention steps

**User Story:** As a user, I want prevention steps that fit this time of year and the ticks near me, so that the advice feels relevant.

#### Acceptance Criteria

1. WHEN the Alerts_Route receives a risk level, THE Alerts_Route SHALL return steps for that level adjusted for the current month.
2. WHERE a town id is also given, THE Alerts_Route SHALL add at most one step specific to the most dangerous species in that town.
3. IF the level is not `low`, `moderate` or `high`, THEN THE Alerts_Route SHALL respond with status 400.

### Requirement 3: Demo safety

**User Story:** As the presenter, I want species and alerts to keep working if a data source fails, so that the demo never breaks.

#### Acceptance Criteria

1. WHILE `DEMO_MODE=1`, THE Species_Route and Alerts_Route SHALL return mock data.
2. IF a data source fails, THEN THE Species_Route and Alerts_Route SHALL return mock data instead of an error.
