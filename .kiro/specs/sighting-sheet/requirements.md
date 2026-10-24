# Requirements Document

## Introduction

Opening New Sighting ran two animations at once: the app-wide page cross-fade and the sheet's own slide-up. Sightings faded to gray, the screen went black in one frame, and the sheet arrived blurred through the fade. The sheet should present like an iOS sheet: it rises over a dimming screen, and it can still be swiped down.

## Requirements

### Requirement 1: One motion when the sheet opens

**User Story:** As a resident reporting a tick, I want New Sighting to slide up cleanly, so the app feels native.

#### Acceptance Criteria

1. WHEN the visitor taps a "Report a sighting" or "+" link THEN the system SHALL NOT run the page cross-fade AND SHALL show only the sheet sliding up.
2. WHILE the sheet rises THEN the backdrop SHALL dim in instead of turning black at once.
3. Other navigations SHALL keep the page cross-fade.

### Requirement 2: Closing still works

**User Story:** As a resident, I want to leave the sheet the ways I already know.

#### Acceptance Criteria

1. Cancel, Escape, swiping the grabber down and posting SHALL each return to Sightings.
2. The tab bar SHALL come back on Sightings.
