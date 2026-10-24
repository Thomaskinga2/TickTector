import { connection } from 'next/server';

import { apiBaseUrl, apiKey } from '@/lib/env';

const MOCK_DELAY_MS = 800;
const UPSTREAM_TIMEOUT_MS = 8_000;

/**
 * Health check for the home page button.
 * Forwards to GET {API_URL}/health, or returns a mock when API_URL is unset.
 */
export async function GET() {
  // Run on every request; without this the mock response would be prerendered at build.
  await connection();

  const base = apiBaseUrl();
  if (!base) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return Response.json({ message: 'Hello from the mock API.', source: 'mock' });
  }

  const key = apiKey();
  try {
    const res = await fetch(`${base}/health`, {
      headers: { Accept: 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) {
      return Response.json({ error: `The API returned status ${res.status}.` }, { status: 502 });
    }
    const data: unknown = await res.json().catch(() => null);
    const message =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : 'API is reachable.';
    return Response.json({ message, source: 'api' });
  } catch {
    return Response.json({ error: 'Could not reach the API. Check API_URL.' }, { status: 502 });
  }
}
