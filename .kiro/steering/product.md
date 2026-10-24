---
inclusion: always
---

# Product

- **Name:** TickTector
- **Track:** <Biotech & healthcare | Energy & climate tech | Civic action>
- **One-liner:** TickTector tells Massachusetts residents how risky ticks are in their town this week, why, and what to do about it.
- **Primary user:** Massachusetts residents heading outdoors (hikers, dog walkers, parents, students) checking their town on their phone before or after going outside.
- **What makes it different:** this week + your town. A weekly, town-level risk level with a plain reason and concrete steps, plus local sightings from neighbors and a photo scan to identify a tick.
- **Pain today:** <what is slow/confusing/expensive now, with one real number if possible>

## The ONE demo flow (everything serves this)
1. User opens the app and searches their town (or taps "Try Amherst").
2. The town page shows this week's risk level with a plain-language reason, with a visible loading state.
3. User sees what to do this week, which ticks are around, and how the town compares on the risk map.
4. User can open the map, report a sighting, or scan a tick.

## Constraints every design respects
- Nothing on the site is made up, and every fact is cited. Risk comes from the newest Mass. DPH surveillance report (read live from mass.gov) and the live National Weather Service forecast, towns and boundaries from the US Census Bureau (Census Geocoder API for "my location"; before the browser shares one, the city-level IP location Vercel adds to each request, labeled approximate and never stored), tick facts from Mass. DPH and CDC pages only. Every level shows its numbers, sources and when each was checked; species and prevention modules list their sources. Use government sources only (Mass. DPH, CDC, NWS, Census).
- Risk, species and scan screens always say it's information, not medical advice.
- Sightings never show exact locations: coordinates are rounded to about 1 km, and photos are stored without EXIF or other metadata.
- Installable on iPhone as a home-screen web app: safe areas, standalone mode, touch first.

## Must-have (MVP)
- The demo flow above, working end-to-end on the deployed URL.
- Real data or a real public API (no lorem ipsum in the demo).
- Mobile-friendly layout.

## Nice-to-have (only after MVP is deployed)
- Multi-language output.
- History / saved results.
- Second input mode.

## Out of scope (do NOT build)
- Auth / login (use a demo user).
- Payments, admin panels, settings pages.
- Anything not visible in the 3-minute demo.

## Safety / responsibility
- Health, legal, or civic advice: show a short disclaimer and frame output as information, not diagnosis or legal advice.
- Never store personal data beyond the session unless required for the demo.
## Demo link (deployment)
- The app must work on a public Vercel URL: anyone can open it with no login.
- Demo URL: <dán link vào đây sau khi deploy>
- Required env vars on Vercel: none (DPH reports, the NWS forecast and the Census Geocoder need no key; bundled copies are the fallback). Optional: `DEMO_MODE`, `GEOCODING_PROVIDER`, `GEOCODING_API_KEY`, `FORUM_STORE` (see `.env.example`). Add the vision model's API key once the scan feature uses one.
- Before saying any feature is done, it must also work on the deployed URL (test in an incognito window).
- If a live call fails on the live site, show the real bundled data and say what's missing, never invented values.