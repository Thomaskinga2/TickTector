# Requirements Document

## Introduction

Redesign every TickTector screen as a native-feeling iOS 27 web app that follows Apple's Human Interface Guidelines and the Liquid Glass design language, so it can be installed on an iPhone home screen and demoed live. The signature surface is the town page, built in the grammar of Apple Weather: the screen takes on the color of the town's risk level, the level reads at a glance, and the details sit in glass modules. All product truth, content, data contracts, feature flags and the TEAM.md wiring (page → component → service → route) stay unchanged.

## Glossary

- **App**: the TickTector Next.js web app.
- **Tab_Bar**: the floating Liquid Glass bar with Home, Map, Scan, Forum and Quest.
- **Nav_Bar**: the glass bar at the top of a screen that shows the inline title and actions once the large title scrolls away.
- **Large_Title**: the big screen title at the top of a tab's root screen.
- **Risk_Backdrop**: the full-screen color field behind the town page, derived from the risk level.
- **Risk_Readout**: the town name, risk level and reason at the top of the town page.
- **Module**: a glass panel on the town page with a small header (icon + label) and one kind of content.
- **Town_Row**: one town in the Home list, tinted by its level, like a city in Weather's list.
- **Level_Glyph**: a 1/2/3-bar mark that encodes the level by shape, next to every risk color.

## Requirements

### Requirement 1: Native iOS structure everywhere

**User Story:** As an iPhone user, I want TickTector to behave like the apps I already use, so that I never have to learn it.

#### Acceptance Criteria

1. THE App SHALL show the Tab_Bar on every screen except compose sheets, floating above content and clear of the home indicator, with the current tab highlighted in the tint color.
2. WHEN a tab's root screen is at the top, THE screen SHALL show its Large_Title; WHEN the visitor scrolls the Large_Title away, THE Nav_Bar SHALL show the title inline.
3. WHEN a screen is deeper than a tab root (town page, post, new post), THE Nav_Bar SHALL offer a chevron-only back control (iOS 26 HIG) whose accessible label names the destination.
4. THE App SHALL use glass only for bars, controls and floating panels that sit over content, never for glass on glass.
5. THE App SHALL use the system font so it renders in SF Pro on Apple devices, with the iOS text style scale.
6. THE App SHALL keep every tap target at least 44 × 44 points.

### Requirement 2: Weather-style town page

**User Story:** As someone about to go outside, I want my town's risk to hit me at a glance, so that I know what to do in seconds.

#### Acceptance Criteria

1. WHEN a town page loads, THE Risk_Backdrop SHALL take on the color of the town's level, and THE Risk_Readout SHALL show the town name, the level in large type with its Level_Glyph, the week, and the reason.
2. WHEN the visitor scrolls, THE Risk_Readout SHALL condense into the Nav_Bar (town name and level on one line).
3. THE town page SHALL show Modules for: what to do this week, ticks around here, sightings nearby, and the map around the town.
4. THE map Module SHALL focus on the town and its neighbors and SHALL open the full map when tapped.
5. WHILE risk data is loading, THE Risk_Readout SHALL show a neutral placeholder; IF it fails, THEN it SHALL show the error with "Try again".
6. IF a town has no data, THEN THE page SHALL say so plainly instead of showing an empty level.

### Requirement 3: Home is the town list

**User Story:** As a visitor, I want to see towns and their levels immediately, so that I can jump to mine.

#### Acceptance Criteria

1. THE Home screen SHALL show a search field and a list of Town_Rows, highest risk first, each showing the town, county and level with its Level_Glyph.
2. WHEN the visitor types in the search field, THE list SHALL narrow to matching towns, and SHALL say so when nothing matches.
3. WHEN the visitor taps a Town_Row, THE App SHALL open that town's page.

### Requirement 4: Map, forum, scan and quest in iOS grammar

**User Story:** As a visitor, I want every screen to feel part of the same app, so that the demo reads as one product.

#### Acceptance Criteria

1. THE Map screen SHALL filter with an iOS segmented control and list towns in an inset grouped list.
2. THE Forum screen SHALL show sightings as a list with a compose button in the Nav_Bar; THE new-post screen SHALL be an iOS form with Cancel and Post actions; THE post screen SHALL show comments and a composer bar.
3. WHEN a feature flag is off, THE screen SHALL show an iOS "content unavailable" view (symbol, title, one line) instead of a broken control.

### Requirement 5: Light appearance and accessibility

**User Story:** As any iPhone user, I want the app to respect my settings, so that it's comfortable and readable for me.

#### Acceptance Criteria

1. THE App SHALL always use the light appearance, even when the system is in dark mode, and SHALL set the browser and status-bar colors to match.
2. WHERE Reduce Transparency is on, THE App SHALL replace glass with solid surfaces; WHERE Increase Contrast is on, THE App SHALL strengthen borders and separators.
3. WHERE Reduce Motion is on, THE App SHALL replace springs, parallax and shared-element transitions with fades or instant changes.
4. THE App SHALL never encode risk by color alone: every risk color appears with its label and Level_Glyph.
5. THE App SHALL keep text contrast at or above 4.5:1 (3:1 for large text), including over the Risk_Backdrop.

### Requirement 6: Motion with purpose

**User Story:** As a demo audience, I want the app to feel alive and polished, so that it feels like a real product.

#### Acceptance Criteria

1. WHEN a town page opens, THE Risk_Readout SHALL settle in with one spring (the signature moment), and the Level_Glyph bars SHALL fill in order.
2. THE App SHALL use spring-based easing for interactive changes (pressed states, tab switches, selections) and SHALL keep content visible by default.
3. THE App SHALL not animate anything that blocks reading or input.

### Requirement 7: Installable and demo-safe

**User Story:** As the team, I want the redesign to install and run reliably on stage.

#### Acceptance Criteria

1. THE App SHALL respect iPhone safe areas in standalone mode and SHALL declare a matching light theme color.
2. THE App SHALL keep the health disclaimer on risk, species and scan screens, and SHALL keep sighting locations at about 1 km.
3. THE redesign SHALL not change API routes, services, types, mock data or feature flags.
4. THE App SHALL pass `npm run typecheck` and `npm run build`, add no new lint errors, and show no console errors.
