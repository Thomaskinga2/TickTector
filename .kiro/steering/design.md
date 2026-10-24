---
inclusion: fileMatch
fileMatchPattern: ["app/**/*.tsx", "components/**/*.tsx", "app/globals.css"]
---

# TickTector design system (iOS 27, soft pastel blocks, level faces, Tick the detective)

TickTector should feel like a native iPhone app that follows Apple's Human Interface Guidelines and Liquid Glass, with its own soft, cute personality: warm beige neutrals, white rounded blocks, flat pastels, rounded display type, a little face for each level, a meadow whose grass grows with the risk, a detective's radar, and Tick, a small detective tick. Full rationale lives in `.kiro/specs/ios-redesign/` and `.kiro/specs/risk-and-map/`. These rules apply to every UI file.

## The one idea

**Color means risk, and nothing else.** Each level has a pastel, an ink and a face: Low sage (content face), Moderate butter (unsure face), High coral (worried face, sweat drop). The town page hero takes its level's pastel with the meadow (`Meadow`: trimmed grass with daisies at Low, knee-high at Moderate, tall and swaying at High, because ticks wait at the tips of tall grass); Home groups counties into one block per level; the map shades towns in the pastels. Everything else is beige and white with the leaf-green tint. Never use the level colors, faces or meadow heights for anything other than a town's tick risk this week, and always put the level's word beside them. Other ratings, such as a species' disease risk, are plain text ("Disease risk: high").

## Tokens (`app/globals.css`)

- Neutrals are TickTector's own warm "field notebook" beige (background `#f4efe4` / card `#fdfbf6`) in place of iOS's cool gray, in the same grouped structure. Risk greens stay stronger than the neutrals so Low still reads as a level. iOS system roles are mapped onto the shadcn token names (`background`, `card`, `foreground`, `muted-foreground`, `primary`, `separator`, `fill`, ...). Use those names; never hard-code hex values in components.
- Light only: the app stays light even when the phone is in dark mode (`color-scheme: light`, one theme color). Don't add dark variants or `prefers-color-scheme: dark` rules. Tint is leaf green (`#2f7a41`, 4.6:1 on the background).
- Level colors: `--level-low|moderate|high` (flat pastels for faces, tints and map fills) and `--level-*-ink` (deeper ink of the same hue for text and marks; `--risk-*` points at the inks). Ink on its tint holds 4.5:1. `.level-block--<level>` sets `--level` / `--level-ink` for a subtree; `.level-ink` colors text with it.
- Surfaces: `.soft-block` is the one card surface (22px radius, `card` fill, soft offset shadow). `List` uses it too. Never a block on a block: anything nested in one goes flat (`.soft-block .soft-block`). The town hero adds `.town-hero` (28px, level pastel over the card); coming-soon screens and the 404 reuse it as a meadow card (Tick asleep, or puzzled at the 404).
- `.sheet` scopes a subtree to the elevated grouped colors used inside sheets.

## Type

Use the `type-*` utilities, never `text-*` sizes (tailwind-merge in `cn` treats unknown `text-*` as a color and drops one class):
`type-large-title` 34/41 · `type-title1` 28/34 · `type-title2` 22/28 · `type-title3` 20/25 · `type-headline` 17/22 semibold · `type-body` 17/22 · `type-callout` 16/21 · `type-subhead` 15/20 · `type-footnote` 13/18 · `type-caption1` 12/16 · `type-caption2` 11/13.
Font is `system-ui` (SF Pro on Apple devices); the display styles (`type-large-title` … `type-title3`) use SF Pro Rounded (`--font-rounded`), as Fitness and Reminders do. Headers are sentence case: no uppercase, no letter-spacing kickers (map county names are the one cartographic exception).

## Tick, the detective

`components/tick.tsx`: a round, friendly female deer tick (dark shield, clay body, eight legs) holding a magnifying glass. It's also the app icon (`scripts/make-icons.mjs`; change both drawings together).
- Moods: `happy`, `sleepy` (features not awake yet; z's drift up), `puzzled` (errors and searches that miss; head tilt and a "?").
- Motions: `hello` (Home: hops in, then now and then peeks through the glass), `search` (loading: legs paddle, glass sweeps).
- Logo (`components/logo.tsx`): Tick at the front of the wordmark, waving its magnifying glass (`motion="wave"`), and the "o" in "Tector" drawn as the glass with a glint. Sized in em: Home's large title and the compact bar use the same component. App icons and the link preview (`app/opengraph-image.png`) come from `scripts/make-icons.mjs`.
- Where: Home's title (on its radar; tap to make it hop), every loading / empty / error / coming-soon state, the "Why this level" header (Tick inspecting the evidence), the map's hint chip, the 404 page.
- Tick blinks now and then. `TickCrawler` is Tick on patrol along a dotted trail (end of Home and town pages), turning to face where it walks; empty states have Tick crawl in. Only in open space, never over content or controls.
- Radar (`components/radar.tsx`): an SVG scope (rings, crosshair) with a sweeping beam. Blips are data: `RadarCard` on Home places one per DPH county group at its real position (Census town centers), in its level color, and each blip pulses as the beam reaches its angle. Tap → map. The bare radar (no blips) is the loading indicator; the selected town on the map pings like a blip.
- Tick is the app's centerpoint and has a detective's voice, used sparingly and always clear: "Tick is on the case…" (loading), "Tick searched everywhere…" (no match), "Tick's evidence: why this level", "Case file · <week>" (Home radar bubble), "This trail goes cold" (404), toasts like "Posted. Thanks for the tip!". Facts never go in Tick's mouth unless they're real (the radar bubble's count is the real number of county groups).
- Home: Tick runs the radar from its center, turning with the beam; one Tick per screen.
- Never on the risk readout, never colored by level, never replacing a level face. Tick is brand, not data.

## Materials

- `glass`: only for the tab bar, bar buttons and floating controls over content. Never glass on glass, never glass on content cards.
- Nav bars never change while you scroll. Screens with their own big title (large title or hero) have a bar of glass buttons only: no backdrop, no inline title. Screens without one (a post, a sheet) show the title on the frosted `scroll-edge` from the start. No bar shadows.
- Every material has a Reduce Transparency fallback (opaque fill) and an Increase Contrast fallback. Add both for any new material.

**Live blur (`backdrop-filter`) only on the tab bar.** Page transitions draw from snapshots, and an unclipped snapshot of a blurred element shows a square-cornered box; switching the blur off for transitions made it pop back in late. The tab bar keeps its blur in every frame because its snapshot group is clipped to the capsule (`::view-transition-group(tab-bar)`) and its shadow has its own snapshot (`.tab-bar-shadow`). Don't put a transition name on any ancestor of the glass (that stops the blur). Everything else using `glass` is a near-opaque fill with the glass highlight and edge, the same in every frame.

## Components to reuse

| Need | Use |
| --- | --- |
| A screen | `Page` (`components/page.tsx`): large title that collapses into the sticky bar; `back`, `leading`, `trailing`, `hero` (the town page renders its own h1), `inSheet` inside sheets |
| Grouped content | `Section`, `List` / `ListRow` (`components/ui/list.tsx`) |
| Buttons | `Button` variants `default` (filled tint capsule, one per screen), `tinted`, `gray`, `plain`, `glass`, `destructive` |
| Choosing one of a few | `SegmentedControl` |
| Showing a level | `LevelFace` (the level's face) or `RiskBadge` (face + word). Never color alone |
| Town page modules | `TownModule` (soft block: round sage icon chip + headline, then content) |
| Town page hero | `RiskReadout` (level pastel, face, word, week, reason) with `Meadow` along the bottom |
| Loading / error / empty / not built yet | `slotStatus`, `LoadingState`, `ErrorState` (with Try again), `EmptyState`, `ComingSoon` (centered content-unavailable view), `Disclaimer` |
| Dates | `formatWeekRange`, `formatRelative` (`components/format.ts`); the device clock is `DeviceClock`, browser-only |

## Navigation

- Floating tab bar (Towns, Map, Scan, Sightings, Quest); town pages belong to Towns. Hidden only on compose sheets.
- Back is a circular chevron with no text; its `aria-label` names the destination.
- Compose screens are large-detent sheets: grabber, rounded top corners, Cancel leading, one tinted primary action trailing, disabled until required fields are filled.

## The map

TickTector draws its own map from Census boundaries (`components/risk-map-canvas.tsx`); there is no tile server. Towns are shaded by level, county lines on top, names by zoom. Map colors are `--map-*` tokens scoped to `.risk-map`. Controls are our own glass buttons. Keep it quiet: no basemap clutter, no third-party styles.

## Motion

Animate with **Motion** (motion.dev, `motion@14`), loaded lazily: `import * as m from "motion/react-m"` (never `motion.*`; `LazyMotion strict` in `components/motion-provider.tsx` enforces it). Pick transitions from `lib/motion.ts`: `smooth` (bounce-free spring, the default), `springy` (light bounce for touch and Tick), `list` + `rise` (staggered lists), `revealOnScroll`, `swap` (views replaced in place, inside `AnimatePresence mode="wait"`). Animate transform and opacity only. CSS keyframes are fine for Tick's SVG parts and the map.

- Tab bar: the lozenge slides with a CSS transform on `--ease-spring` and the picked icon hops (`.tab-hop`). These stay in CSS on purpose: JS-driven (Motion) animations stall for ~100 ms while the next page commits, and CSS transforms keep running through it. The same goes for anything that must keep moving during navigation.
- Sheets slide up with `smooth` and drag to dismiss from the grabber (`useDragControls`), so scrolling the form never drags the sheet.
- Town page modules reveal on scroll; "what to do" checks pop in; "Why this level" bars grow when in view; the map's town card springs in and out (`AnimatePresence`).

- `ease-out-smooth` (bounce-free) for layout, fades and sheets; `ease-spring` (light bounce) only for presses, the tab lozenge and the segmented control.
- Signature moment, on the town page only: the readout settles (`readout-in`), the face breathes (`face-bob`), and at High the meadow sways (`meadow-sway`). All off under Reduce Motion.
- Home's county rows rise in one after another inside their level block (Motion `list`/`rise`).
- Navigations cross-fade with a slight rise (React `<ViewTransition>` in `app/layout.tsx`, class `page`); the tab bar is anchored and never blinks. Content swapped in place uses `fade-in`. Sheets slide up. Map camera moves use `flyToBounds` (0.7 s).
- Under Reduce Motion nothing moves along x/y; animations become fades.

## Accessibility and content

- Touch targets 44×44 pt. Text contrast 4.5:1 up to 17 pt, 3:1 at 18 pt or bold; check ink on every level tint.
- Respect safe areas (`env(safe-area-inset-*)`), except inside sheets, which already sit below the status bar.
- **Short and plain.** People skim: one idea per line, everyday words, numbers only where they help ("about the Massachusetts average", "Highs 56–68°F"). Exact figures live in "Tick's evidence", never in the headline.
- **Citations go at the bottom.** Modules call `useCite(sources)` (`components/sources.tsx`); each page wraps its content in `SourcesProvider` and ends with `<SourcesFooter />`: one small line of links under the disclaimer. No inline source blocks in modules.
- **Nothing on screen is invented.** Levels come from Mass. DPH data and the NWS forecast by a stated rule, towns from the Census, tick facts from Mass. DPH and CDC. Show the numbers and link the sources ("Why this level"). No sample people, posts or values; empty is better than fake.
- Every screen that shows levels carries the `Disclaimer` (estimates, not medical advice).
