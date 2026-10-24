# Requirements Document

## Introduction

Every page shipped Motion's full feature set (animation, layout and drag) in its startup JavaScript, though only the New Sighting sheet's swipe-down needs drag and no screen needs it before first paint. On a phone, less JavaScript to download and parse before the first screen means a faster start.

## Requirements

### Requirement 1: Lighter startup

**User Story:** As a resident opening TickTector on a phone, I want the first screen to show up fast.

#### Acceptance Criteria

1. The system SHALL load Motion's features in their own chunk after first paint, not in each page's startup JavaScript.
2. Home's startup JavaScript SHALL shrink compared with the previous build (measured from the scripts in the prerendered HTML).

### Requirement 2: Nothing changes for the visitor

**User Story:** As a visitor, I want the app to look and move exactly as before.

#### Acceptance Criteria

1. WHEN the features arrive THEN every entrance animation SHALL still play (Home's radar card, the map card, the New Sighting sheet).
2. Every route SHALL load at 393×852 and 320×568 with no JavaScript errors and no sideways overflow.
3. The Reduce Motion setting SHALL still be respected.
