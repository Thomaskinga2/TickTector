# Requirements Document

## Introduction

Every fact TickTector shows must be accurate, come from a government source (Mass. DPH, CDC, NWS, US Census), carry a visible citation, and be read live from that source wherever the source allows it, with a checked bundled copy as the fallback.

## Requirements

### Requirement 1: Live Mass. DPH baseline

**User Story:** As a resident, I want the county numbers to come from DPH's newest report, so the level isn't based on a stale copy.

#### Acceptance Criteria

1. WHEN a risk route runs THEN the system SHALL read the newest Tick Exposure and Tick-borne Disease Syndromic Surveillance Report linked from the DPH monthly reports list, at most every 6 hours.
2. WHEN the report is read THEN the system SHALL use Table 1 only if its caption says "by county <year> to date", its columns match, all 13 DPH county groups are present and every printed rate matches its own counts to 0.01.
3. IF mass.gov can't be read or Table 1 doesn't check out THEN the system SHALL use the bundled copy of the last verified report AND say so on the town page.
4. WHEN DEMO_MODE is set THEN the system SHALL use the bundled copy without network calls.

### Requirement 2: Citations

**User Story:** As a judge or resident, I want to see where every number and fact comes from.

#### Acceptance Criteria

1. WHEN "Why this level" shows THEN it SHALL link the exact DPH report and table, the NWS forecast, and say when each was checked or updated.
2. WHEN species or prevention steps show THEN each module SHALL list the DPH and CDC pages its text comes from.
3. The system SHALL label the all-county rate as computed from DPH's county rows and the level rule as TickTector's own.

### Requirement 3: Live town lookup

#### Acceptance Criteria

1. WHEN a location is looked up THEN the system SHALL use the US Census Geocoder to find the town whose boundary contains it.
2. IF the Census Geocoder fails THEN the system SHALL fall back to the nearest town label point.
