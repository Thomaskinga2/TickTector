# Design Document

## Overview

A `MapTownSearch` component sits between the Risk Map's subtitle and its level filter. It filters the bundled town list on the client and hands the picked town to the map page, which already knows how to select a town (fly to it, pin it, open its card).

## Components

- `matchTowns(query, limit)` in `components/map-utils.ts`: the same matching as Home's search (name starts with the text, or a word in it does), over `lib/data/ma-towns.json`.
- `components/map-town-search.tsx`: the search field (Home's look) and a results list below it. Each row shows the level's face, the town, its county and "High / Moderate / Low risk". ARIA combobox: the input owns a `listbox`; `aria-activedescendant` follows the highlighted row.
- `app/map/page.tsx`: `onPick(townId)` sets the filter to All when the town is hidden by it, then selects the town. The existing map selection (`Selection` in `risk-map-canvas.tsx`) zooms to it and the card slot opens.

## Data

Levels come from the heatmap points the map page already loaded (`riskFromIndex(point.value)`); a town with no point is listed without a level.

## Error handling

No network: the list is bundled. Before the heatmap loads, results still list towns, without levels.

## Testing

Phone widths 393 and 320: field fits, list doesn't overflow, picking a town zooms the map and opens its card. Keyboard: Down, Return, Escape.
