# Requirements Document

## Introduction

Home starts with the towns around the visitor instead of a statewide list. It asks for the device's location when the app opens and, until (or unless) that's shared, uses the approximate location of the visitor's internet connection.

## Requirements

### Requirement 1: Ask on start

**User Story:** As a resident, I want TickTector to show my town when I open it, so I don't have to search.

#### Acceptance Criteria

1. WHEN Home first loads THEN the system SHALL ask the browser for the device's location once per page load.
2. WHEN the location is shared THEN the system SHALL find the town containing it with the Census Geocoder (`/api/towns/nearest`) AND show it first under "Near you", followed by the closest other towns, each with this week's level.
3. IF the location is denied, times out or is outside Massachusetts THEN the system SHALL keep the county list usable AND offer a "Show towns near me" button, showing the reason only after it's tapped.

### Requirement 2: Approximate location from the IP address

**User Story:** As a visitor who dismisses the prompt, I still want to start near home.

#### Acceptance Criteria

1. WHEN Home first loads THEN the system SHALL also look up the town around the visitor's IP address from Vercel's `x-vercel-ip-latitude` / `x-vercel-ip-longitude` request headers (`/api/towns/approximate`), with no third-party service.
2. WHILE only the approximate town is known THEN "Near you" SHALL say "Approximate, from your internet connection" AND offer "Use precise location".
3. WHEN a precise location arrives THEN it SHALL replace the approximate one.
4. IF the headers are missing (local dev) or point outside Massachusetts THEN the route SHALL answer 404 / 422 and Home SHALL behave as in 1.3.
5. The system SHALL NOT store either location.
