# Requirements Document

## Introduction

The app baseline is the smallest deployable version of the hackathon web app: one public home page on Vercel with a button that proves the browser → server → upstream API path works. It exists so the team can deploy in the first hour and build the real demo flow (see `.kiro/steering/product.md`) on a foundation that already handles loading, errors, secrets and the demo fallback.

## Glossary

- **App**: the Next.js web application in this repository.
- **Home_Page**: the page served at `/`.
- **Ping_Button**: the primary button on the Home_Page that tests the API connection.
- **Result_Line**: the text below the Ping_Button that reports the outcome of the last API check.
- **Ping_Route**: the route handler at `GET /api/ping`.
- **Upstream_API**: the external backend whose base URL is set in the `API_URL` environment variable.
- **Mock_Mode**: the state in which `API_URL` is unset or empty.

## Requirements

### Requirement 1: Public home page

**User Story:** As a judge, I want to open the deployed URL and immediately see what the app is, so that I can evaluate it without setup or login.

#### Acceptance Criteria

1. WHEN a visitor opens `/`, THE Home_Page SHALL display the app name and a one-sentence tagline without requiring login.
2. THE Home_Page SHALL render without horizontal scrolling at viewport widths from 320 px to 1440 px.
3. WHILE the visitor's system prefers a dark color scheme, THE App SHALL render the dark theme; otherwise THE App SHALL render the light theme.
4. THE App SHALL keep body text contrast at or above 4.5:1 against its background in both themes.
5. THE Home_Page SHALL show whether the App is in Mock_Mode or connected to the Upstream_API.

### Requirement 2: API check from the browser

**User Story:** As a teammate, I want one button that calls our API and shows the result, so that I can confirm the deployed app can reach the backend.

#### Acceptance Criteria

1. WHEN the visitor activates the Ping_Button, THE App SHALL send `GET /api/ping` and disable the Ping_Button until the request finishes.
2. WHILE a request is in progress, THE Ping_Button SHALL show a loading indicator and THE Result_Line SHALL say that the App is waiting for a response.
3. WHEN the Ping_Route responds successfully, THE Result_Line SHALL display the returned message in the success color.
4. IF the request fails, times out after 10 seconds, or returns an error status, THEN THE Result_Line SHALL display a message that names the problem in the danger color and THE Ping_Button SHALL read "Try again".
5. THE Result_Line SHALL be announced to screen readers when its text changes.
6. THE Ping_Button SHALL be operable by keyboard and SHALL show a visible focus indicator.

### Requirement 3: Server-side API proxy with demo fallback

**User Story:** As a presenter, I want the app to keep working when no backend is configured, so that the live demo never fails on stage.

#### Acceptance Criteria

1. WHILE the App is in Mock_Mode, WHEN the Ping_Route receives a request, THE Ping_Route SHALL wait about 800 ms and return `{ message, source: "mock" }` with status 200.
2. WHEN `API_URL` is set and the Ping_Route receives a request, THE Ping_Route SHALL call `GET {API_URL}/health` from the server with an 8 second timeout and return `{ message, source: "api" }`.
3. IF the Upstream_API is unreachable, times out, or returns a non-2xx status, THEN THE Ping_Route SHALL return status 502 with `{ error }` containing a short, actionable message and no upstream details.
4. THE Ping_Route SHALL compute its response at request time and SHALL NOT be prerendered at build time.

### Requirement 4: Secrets stay on the server

**User Story:** As a developer, I want API keys to stay server-side, so that nothing secret is exposed in the deployed page.

#### Acceptance Criteria

1. THE App SHALL read `API_URL` and `API_KEY` only in server code.
2. WHERE `API_KEY` is set, THE Ping_Route SHALL send it to the Upstream_API as a Bearer token from the server.
3. THE App SHALL NOT include `API_URL`, `API_KEY` or any other secret in client bundles or API responses.
4. THE repository SHALL include `.env.example` with every supported variable and SHALL ignore all other `.env*` files.

### Requirement 5: Deployable on every push

**User Story:** As the team, I want every push to `main` to deploy a working build, so that the demo URL is always current.

#### Acceptance Criteria

1. THE App SHALL pass `npm run typecheck`, `npm run lint` and `npm run build` with no errors.
2. WHEN a commit is pushed to `main`, THE App SHALL build on Vercel with its default Next.js settings and no extra configuration.
