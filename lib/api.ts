/**
 * Browser-side API client. Calls this app's own route handlers under /api,
 * which talk to the real backend on the server. Never put secrets here.
 */

const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new ApiError('The request timed out. Try again.');
    }
    throw new ApiError('Network error. Check your connection and try again.');
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Request failed with status ${res.status}.`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

export type PingResponse = {
  message: string;
  source: 'api' | 'mock';
};

export function ping(): Promise<PingResponse> {
  return request<PingResponse>('/api/ping');
}
