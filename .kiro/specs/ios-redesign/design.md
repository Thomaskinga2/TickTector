# Design Document

## Overview

TickTector becomes a native-feeling iOS 27 web app. Structure, controls and type follow Apple's Human Interface Guidelines; bars and controls use a web approximation of Liquid Glass; the town page follows Apple Weather: a full-screen color field for the risk level, a large readout, and material modules. Data, routes, services, types and flags are untouched.

Sources (verified on Apple's site, Oct 2026): HIG Materials, Tab bars, Toolbars, Search fields, Scroll views, Sheets, Lists and tables, Buttons, Segmented controls, Color, Dark Mode, Typography, Layout, Motion, Accessibility; WWDC25 "Meet Liquid Glass" and "Get to know the new design system"; WWDC26 Platforms State of the Union and "What's new in SwiftUI".

## Direction

- **Form:** iOS 27 native app, with the town page in the grammar of Apple Weather. Set by the user's brief (native iOS feel, hemlock tint, Weather-style town page; light only since Oct 24 2026), not generated from a seed.
- **Thesis:** your town's tick risk reads like the weather: one glance at a color and a word tells you how to dress for the outdoors this week.
- **First viewport (town page):** the screen is the level's color. The town name, the level in large type with its 1/2/3-bar glyph, the week range and today's date and time from the device, then the reason in one or two lines.
- **Visitor path:** Home's town list (each row already tinted by its level) → tap → the town page's color field fades in → steps, ticks, sightings, map modules → back.
- **Signature interaction:** the backdrop cross-fades to the level's color, the readout settles with one spring and the glyph bars fill in order.
- **Cut: row-to-page morph.** React `<ViewTransition>` only pairs a shared element when the destination renders in the same commit as the navigation. The town page reads its params inside Suspense and loads the level after mount, so no pair forms. Revisit if the level ever arrives with the route (server-rendered risk).
- **Cross-surface reach:** the same level palette tints Home rows, map pins, filters and badges; every other screen is plain iOS grouped UI so the color means something.
- **Honest risk:** strong color fields can overwhelm; colors are tuned so white text holds 4.5:1 everywhere, and the palette appears only where it encodes risk.
- **Raises from declined challengers:** risk is never color alone (label + glyph everywhere); the town page's map focuses on the town's neighborhood, not a whole-state miniature.

## Architecture

- **Tokens** (`app/globals.css`): iOS system colors mapped onto the existing shadcn token names so every component inherits them; light only (`color-scheme: light`); no dark tokens. Risk palette: Apple's accessible system green/orange/red for marks; Weather-style gradients per level for backdrops and Home rows.
- **Type:** system font stack (renders SF Pro on Apple devices). iOS text styles as Tailwind utilities named `type-*` (not `text-*`, which tailwind-merge would read as a color): `type-large-title` 34/41, `type-title1` 28/34, `type-title2` 22/28, `type-title3` 20/25, `type-headline` 17/22 semibold, `type-body` 17/22, `type-callout` 16/21, `type-subhead` 15/20, `type-footnote` 13/18, `type-caption1` 12/16, `type-caption2` 11/13. Tracking is left to the system font, which applies SF's size-specific tracking.
- **Materials:** `glass` (tab bar, bar buttons, floating controls): translucent fill + `backdrop-filter: blur(28px) saturate(180%)` + inset top highlight + soft shadow, capsule or circle shapes. `glass-on-sky`: the tab bar over a town page (dark material, white symbols). `material-on-sky` for Weather modules (content layer, never glass on glass). Nav bars have no material of their own: a `scroll-edge` layer (blur + fill, masked to fade out 24px below the bar) fades in once content scrolls under them, tinted by the level's top color on town pages. Reduce Transparency and Increase Contrast swap all of them for opaque fills.
- **Sheets:** compose screens (New Sighting) are large-detent sheets: slide up, rounded top corners, grabber, elevated grouped colors, no tab bar.
- **Motion:** `--ease-out-smooth` (bounce-free spring stand-in, Apple's `spring(duration: 0.5, bounce: 0)`) for layout and fades; `--ease-spring` (light bounce via `linear()`) for presses and selections; Reduce Motion turns moves into fades.

## Components and Interfaces

| Component | Role |
| --- | --- |
| `components/tab-bar.tsx` (replaces `bottom-nav.tsx`) | Floating glass capsule, 5 tabs, tinted selection lozenge, safe-area aware |
| `components/page.tsx` | `Page({ title, back, trailing, tone, largeTitle, children })`: large title in content, sticky glass nav bar that shows the inline title once the large title scrolls away (IntersectionObserver), circular glass back button (chevron only, labeled for screen readers). `Section` = grouped section with a Title 3 header |
| `components/ui/list.tsx` | `List`, `ListRow` (44 pt min, inset separators, optional chevron/link) for inset grouped lists |
| `components/ui/button.tsx` | Variants: `default` (filled tint capsule), `tinted`, `gray`, `plain`, `glass`, `destructive`; spring press |
| `components/ui/segmented-control.tsx` | iOS segmented control with a sliding selection pill |
| `components/risk-badge.tsx` | `LevelGlyph` (1/2/3 bars, animatable), `RiskBadge` (glyph + label) |
| `components/risk-backdrop.tsx` | Full-screen level gradient for the town page; cross-fades when the level arrives |
| `components/device-clock.tsx` | Today's date and time from the device clock and time zone, browser-only, updates every minute |
| `components/town-browser.tsx` | Home: search capsule and Weather-style town rows (level gradient, name, county, level, two-line reason), highest risk first |
| Town page modules | `RiskReadout`, `ActionAlerts`, `TickSpeciesList`, `NearbySightings`, focused `Heatmap` |
| `components/states.tsx` | `LoadingState`, `ErrorState`, `EmptyState`, `ComingSoon` (iOS "content unavailable"), `Disclaimer` |

Pages keep their data flow: `useAsync(() => service())` → components. Home combines `searchTowns("")`, `getHeatmap()` and `getWeeklyRisk(id)` for each town; the town page adds `getPosts(townId)` for nearby sightings.

## Data Models

No changes to `lib/types.ts`, routes or mock data. The week label is derived from `WeeklyRisk.weekOf` (the Sunday that starts the US calendar week) as "Oct 18 – 24"; the device clock never comes from the server.

## Error Handling

Same slot pattern as before (`slotStatus`): loading, error with "Try again", empty. On the town page, the readout shows a neutral backdrop and placeholder while loading; a failed risk call shows the error on the backdrop with "Try again".

## Correctness Properties

### Property 1: Level encoding is redundant
*For any* place a risk level is shown, the color is accompanied by the level's label and its glyph with the matching number of filled bars (low 1, moderate 2, high 3).
**Validates: Requirements 5.4**

### Property 2: Week range is the risk week
*For any* `weekOf` Sunday date, the label shows that Sunday through the following Saturday, crossing month and year boundaries correctly.
**Validates: Requirements 2.1**

### Property 3: Device time is the device's
*For any* device time zone, the clock line shows the device's local date and time, and nothing is rendered on the server.
**Validates: Requirements 2.1**

### Property 4: Contrast holds on every backdrop
*For any* level and appearance, white text on the level gradient and its modules meets 4.5:1 for body text.
**Validates: Requirements 5.5**

### Property 5: Reduced settings are honored
*For any* screen, with Reduce Motion on no element moves along x/y (fades only), and with Reduce Transparency or Increase Contrast on no translucent fill is used.
**Validates: Requirements 5.2, 5.3**

### Property 6: The level glyph means this town, this week
*For any* screen, the Level_Glyph and level words appear only for a town's weekly risk; other ratings (such as a species' disease risk) are plain text.
**Validates: Requirements 5.4**

### Property 7: The focused map centers its town
*For any* town with map data, the town page's map preview puts that town at the center of the frame with its name label fully visible, and the map attribution stays inside the rounded frame.
**Validates: Requirements 2.4**

## Testing Strategy

- `npm run typecheck`, `npm run lint` (0 problems), `npm run build`.
- One batched browser round at iPhone size (393 × 852), including a dark-mode device to confirm it stays light, plus desktop width: Home, town page (high, moderate, low), map, forum list/detail/new, scan, quest; console errors recorded; then one confirmation round after fixes.
- Week-range unit check across month and year boundaries.
