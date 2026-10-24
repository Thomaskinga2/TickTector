# Requirements Document

## Introduction

Neighbors can attach a photo of the tick to a sighting, and the Sightings screens show those photos. Photos must never reveal more about where someone lives than the post's ~1 km location does.

## Requirements

### Requirement 1: Attach a photo

**User Story:** As a resident reporting a tick, I want to add a photo, so neighbors can see what I found.

#### Acceptance Criteria

1. WHEN composing a sighting THEN the form SHALL offer one optional photo, taken with the camera or chosen from the library.
2. WHEN a photo is picked THEN the system SHALL resize it in the browser to a JPEG of at most 1600 px on the longest side AND show a preview with a remove button.
3. IF the browser can't decode the photo THEN the form SHALL say so and keep the rest of the post.

### Requirement 2: Privacy and limits

#### Acceptance Criteria

1. WHEN a photo is received THEN the API SHALL accept only a well-formed JPEG under 4 MB AND remove its EXIF, XMP and other metadata segments before storing it.
2. The API SHALL serve stored photos at `/api/forum/photos/:id` and save that URL as the post's `photoUrl`.
3. WHILE `FORUM_STORE=mock` THEN photos SHALL be kept in memory with the posts, capped at 200.

### Requirement 3: Show photos

#### Acceptance Criteria

1. WHEN the list shows a post with a photo THEN its row SHALL show a thumbnail.
2. WHEN a post opens THEN its photo SHALL lead the card, and tapping it SHALL open it at full size.
