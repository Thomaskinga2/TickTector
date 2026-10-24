# Design Document

## Flow

```
NewPostForm › PhotoField ── preparePhoto(file) (lib/photo.ts: createImageBitmap → canvas → JPEG 0.85)
  → createPost (multipart "photo")
  → POST /api/forum/posts: size check → stripJpegMetadata → store.savePhoto → photoUrl = /api/forum/photos/:id
  → GET /api/forum/photos/:id: image/jpeg, immutable cache
```

- Redrawing on a canvas already drops EXIF; the server strips APP1–APP15 and COM segments again, so a direct API call can't publish GPS either.
- Only JPEG is accepted server-side because the browser always converts; PNG, HEIC and the rest are converted before upload.
- `ForumStore` gains `savePhoto` / `getPhoto`. A Supabase store would put photos in Supabase Storage and return its public URL instead.
- Polish: the list shows a trailing thumbnail, a tick-type tag and a sightings count; the post is one soft block with the photo on top, place and tick-type chips, and line breaks kept in the description.
