---
inclusion: always
---

# Product

- **Name:** TikTector
- **Track:** Civic action
- **One-liner:** TikTector helps people in Massachusetts check this week's tick risk for their town and know what to do about it, from prevention steps to identifying a tick from a photo.
- **Primary user:** a UMass Amherst student who walks, runs or hikes the trails around campus and doesn't know which ticks live there or how worried to be this week.
- **Pain today:** tick risk information is scattered across state health pages, CDC maps and news articles, none of it is per town or per week, and none of it says what to do today. <Add one sourced number, e.g. Lyme disease cases in Massachusetts last year.>

## The ONE demo flow (everything serves this)
1. User opens the app on an iPhone and searches "Amherst" (or taps "Use my location").
2. The town page shows this week's risk gauge (Low / Moderate / High) with a one-line reason, in under a second.
3. Below it: the ticks found in the area with the diseases they carry, and prevention steps matched to the risk level. The "wow" element is the risk gauge plus the risk map across Massachusetts.
4. User takes one action: scans a tick with the camera to identify it, or reports a sighting on the forum.

## Must-have (MVP)
- The demo flow above, working end-to-end on the deployed URL.
- Real data or a real public API for risk and species (no lorem ipsum in the demo).
- Mobile-first layout that works in iPhone Safari and installs as a PWA.

## Nice-to-have (only after MVP is deployed)
- Real map for the heatmap.
- Tick identification from a photo with a vision model.
- Persistent forum with photo uploads.
- TikQuest, a location-based game about tick safety (currently "Coming soon").

## Out of scope (do NOT build)
- Auth / login (forum uses a display name only).
- Payments, admin panels, settings pages.
- Anything not visible in the 3-minute demo.

## Safety / responsibility
- Health information: show "Information only, not medical advice." on every screen with risk, species or scan results.
- Forum posts never show an exact location: coordinates are rounded to about 1 km. Remind users not to post personal information.
- Never store personal data beyond what a forum post needs.

## Demo link (deployment)
- The app must work on a public Vercel URL: anyone can open it with no login.
- Demo URL: https://my-app-eosin-kappa-50.vercel.app/
- Required env vars on Vercel: none for the demo (everything runs on mock data). Optional: `DEMO_MODE`, `GEOCODING_PROVIDER`, `GEOCODING_API_KEY`, `FORUM_STORE` (see `.env.example`). Add the vision model's API key once the scan feature uses one.
- Before saying any feature is done, it must also work on the deployed URL (test in an incognito window).
- If an API or AI call fails on the live site, show the mock fallback instead of an error.
