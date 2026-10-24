# Design Document

## Overview

The root layout's `<ViewTransition>` maps the `sheet-open` transition type to `"none"`. The three links to `/forum/new` (Sightings' "+" and "Report a sighting", the town page's "Report a sighting") pass `transitionTypes={["sheet-open"]}`, so React starts no view transition and the sheet's own Motion slide-up is the only movement. In `app/forum/new/page.tsx` the black backdrop is a Motion layer that fades in over 0.35 s.

## Considered

A custom view transition (old page shrinking into the peek, sheet on its own layer) was tried and dropped: it doubled up with the sheet's Motion animation and added a lot of CSS for a small gain.

## Testing

Frame-by-frame films of opening and closing at 375×812; a swipe-down on the grabber returns to `/forum`; a probe confirms no view transition starts on open.
