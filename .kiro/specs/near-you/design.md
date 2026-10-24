# Design Document

## Overview

```
TownBrowser ── useNearMe(features.geolocation)
                 ├─ findApproximateTown() → GET /api/towns/approximate → townAt(Vercel IP lat/lng)
                 └─ useGeolocation().request() → findNearestTown() → GET /api/towns/nearest → townAt(lat/lng)
             └─ NearYou: near town + 4 closest towns (equirectangular distance to label points), TownList rows
```

- `townAt(lat, lng)` in `lib/providers/geocoding.ts` is shared by both routes: the configured geocoding provider, `null` outside MA.
- `useNearMe` keeps the result in module state, so returning to Home doesn't ask again during the visit. Both lookups start together; a precise result always wins over an approximate one.
- The automatic ask runs after the first commit (`Promise.resolve().then(locate)`), not during render.
- `/api/towns/approximate` reads request headers, so it calls `connection()` and runs per request.
- Replaces the old Home `LocationButton`; the forum's "Use my location" turns on with the same flag.
