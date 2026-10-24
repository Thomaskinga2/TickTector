/**
 * Server-side settings. Only import this from server code (route handlers,
 * server components). Non-NEXT_PUBLIC_ variables never reach the browser.
 */

/** Upstream API base URL without a trailing slash, or null to use the mock. */
export function apiBaseUrl(): string | null {
  const value = process.env.API_URL?.trim().replace(/\/+$/, '');
  return value ? value : null;
}

/** Optional upstream API key. Sent from the server only. */
export function apiKey(): string | null {
  const value = process.env.API_KEY?.trim();
  return value ? value : null;
}
