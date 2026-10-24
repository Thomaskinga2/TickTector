# Implementation Plan

- [x] 1. Server
- [x] 1.1 `stripJpegMetadata`, `savePhoto` / `getPhoto` in `lib/providers/forum-store.ts`
  - _Requirements: 2.1, 2.3_
- [x] 1.2 Photo handling in `POST /api/forum/posts`; `GET /api/forum/photos/[id]`
  - _Requirements: 2.1, 2.2_

- [x] 2. Client
- [x] 2.1 `lib/photo.ts` resize; `PhotoField` in `components/new-post-form.tsx`
  - _Requirements: 1.1, 1.2, 1.3_
- [x] 2.2 Thumbnails in `ForumPostList`, photo-led `ForumPostCard`, sightings count on `/forum`
  - _Requirements: 3.1, 3.2_

- [ ] 3. Try on an iPhone (camera and HEIC library photos)
  - _Requirements: 1.1, 1.3_
