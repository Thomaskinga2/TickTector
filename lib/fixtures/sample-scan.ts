import type { ScanPostInput } from "@/lib/types";

// One scan, shaped exactly like the scan screen will send it. Used by tests/forum.test.mjs and by the
// dev-only "Post sample scan" button on /forum. The photo carries fake GPS EXIF so both show it gets stripped.
export const SAMPLE_SCAN: ScanPostInput = {
  photo: "/samples/scan-tick.jpg",
  species: "deer-tick",
  confidence: 0.82,
  stage: "adult",
  location: { town: "Amherst", lat: 42.3732, lng: -72.5199 },
  scannedAt: "2026-10-24T15:21:00.000Z",
};
