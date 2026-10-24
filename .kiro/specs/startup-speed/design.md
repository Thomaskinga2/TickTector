# Design Document

## Overview

`components/motion-provider.tsx` passes `LazyMotion` a loader, `() => import("@/lib/motion-features")`, instead of `domMax` itself. `lib/motion-features.ts` re-exports `domMax`, so the bundler splits it into its own chunk. Components keep using `m.*` from `motion/react-m` (strict mode), so nothing else changes.

## Measurements

| Build | Home startup JS (raw) |
|---|---|
| Before (features bundled) | 790 KB |
| After (features lazy) | 709 KB |

Other chunks checked and left alone: Leaflet is already loaded only by the map (`next/dynamic`), tick photos already go through `next/image`, and the basemap JSON is 100 KB gzipped and fetched only by maps.

## Testing

Every route at 393×852 and 320×568: errors, overflow, screenshots. Frame-by-frame films of Home's entrance, the map card and the New Sighting sheet.
