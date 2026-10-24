# Requirements Document

## Introduction

The forum lets users report tick sightings and discuss them. Today posts and comments live in memory (`mockForumStore` in `lib/providers/forum-store.ts`), so they reset on every deploy and differ between Vercel instances. Photos are accepted but not stored, and the Report button does nothing. This feature adds persistent storage, photo uploads, moderation reports and live comments. Owner: Backend 2 (see `TEAM.md`). The `FORUM_STORE=supabase` slot is already wired.

## Glossary

- **App**: the TikTector Next.js web application.
- **Forum_Store**: the `ForumStore` implementation selected by `FORUM_STORE`.
- **Post**, **Comment**: `ForumPost` and `ForumComment` in `lib/types.ts`.
- **Report**: a user flagging a Post or Comment for review.

## Requirements

### Requirement 1: Persistent posts and comments

**User Story:** As a user, I want my sighting to still be there tomorrow, so that other people nearby can see it.

#### Acceptance Criteria

1. WHERE `FORUM_STORE=supabase`, THE Forum_Store SHALL save Posts and Comments in a database so they survive deploys and are the same on every server instance.
2. THE Forum_Store SHALL store coordinates already rounded to 2 decimals, and the API SHALL never return more precision.
3. THE App SHALL keep the existing API contracts in `app/api/forum/` unchanged, so the UI needs no changes.
4. WHILE `DEMO_MODE=1`, THE App SHALL use the in-memory mock Forum_Store.

### Requirement 2: Photo uploads

**User Story:** As a user, I want to attach a photo of the tick I found, so that others can help identify it.

#### Acceptance Criteria

1. WHEN a new Post includes an image up to 10 MB, THE App SHALL store the image and save its public URL as `photoUrl`.
2. THE post detail page SHALL show the photo when `photoUrl` is set.
3. THE App SHALL strip location metadata (EXIF GPS) from photos before storing them.

### Requirement 3: Reports

**User Story:** As a user, I want to flag a post that shares personal information, so that it can be removed.

#### Acceptance Criteria

1. WHEN the user taps Report on a Post or Comment, THE App SHALL send the report to `POST /api/forum/reports` and show "Reported".
2. WHEN a Post receives 3 or more Reports, THE Forum_Store SHALL hide it from the post list.

### Requirement 4: Live comments

**User Story:** As a user reading a sighting, I want new comments to appear without reloading, so that the discussion feels live.

#### Acceptance Criteria

1. WHILE the post detail page is open, THE App SHALL show new Comments on that Post within 5 seconds of them being added.
2. THE App SHALL not show the same Comment twice.
