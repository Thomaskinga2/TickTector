# Requirements Document

## Introduction

The scan page lets a user photograph a tick and learn what it is and what to do. Today `POST /api/scan` validates the upload and returns one mock `ScanResult`, and the camera is behind the `camera` feature flag. This feature sends the photo to a vision model and turns the camera on. Owner: Backend 2 (see `TEAM.md`). The model provider is chosen in the design phase.

## Glossary

- **App**: the TikTector Next.js web application.
- **Scan_Route**: `POST /api/scan`, taking a multipart `photo` field and returning `ScanResult` from `lib/types.ts`.
- **Vision_Model**: the image-capable AI model the Scan_Route calls.
- **Scan_Page**: the page at `/scan`.

## Requirements

### Requirement 1: Identify a tick from a photo

**User Story:** As a user who just found a tick, I want to photograph it and learn what species it is, so that I know how worried to be.

#### Acceptance Criteria

1. WHEN the Scan_Route receives a valid image, THE Scan_Route SHALL send it to the Vision_Model and return a `ScanResult` with the species common name, a confidence from 0 to 1, and one or two sentences of advice.
2. IF the Vision_Model cannot identify a tick in the image, THEN THE Scan_Route SHALL return `species: null` with advice on taking a better photo.
3. THE Scan_Route SHALL only report species from the list in `lib/mock-data.ts` (or its real-data replacement), so the result links to known species.
4. THE Scan_Route SHALL validate the Vision_Model output with zod before returning it.

### Requirement 2: Upload limits

**User Story:** As a teammate, I want bad uploads rejected before they reach the model, so that we don't waste calls.

#### Acceptance Criteria

1. IF the request has no photo, THEN THE Scan_Route SHALL respond with status 400.
2. IF the file is not an image, THEN THE Scan_Route SHALL respond with status 400.
3. IF the file is larger than 10 MB, THEN THE Scan_Route SHALL respond with status 413.

### Requirement 3: Camera on the phone

**User Story:** As an iPhone user, I want the scan button to open my rear camera, so that I can photograph the tick right away.

#### Acceptance Criteria

1. WHEN the `camera` flag in `lib/features.ts` is true, THE Scan_Page SHALL show a button that opens the rear camera on iPhone Safari and the photo picker on desktop.
2. WHILE a scan is in progress, THE Scan_Page SHALL show the photo preview and a loading state.
3. THE Scan_Page SHALL show "Information only, not medical advice." with every result.

### Requirement 4: Reliability and secrets

**User Story:** As the presenter, I want the scan to work on stage even if the model is slow, so that the demo never breaks.

#### Acceptance Criteria

1. THE Scan_Route SHALL call the Vision_Model with a timeout of about 30 seconds.
2. IF the Vision_Model fails, times out or returns invalid output, THEN THE Scan_Route SHALL return the mock `SCAN_RESULT`.
3. WHILE `DEMO_MODE=1`, THE Scan_Route SHALL return the mock `SCAN_RESULT` without calling the Vision_Model.
4. THE App SHALL read the model API key only from a server-only env var listed in `.env.example`.
