'use client';

import { useState } from 'react';

import { ping } from '@/lib/api';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export function PingButton() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const loading = status.kind === 'loading';

  async function handleClick() {
    setStatus({ kind: 'loading' });
    try {
      const res = await ping();
      setStatus({ kind: 'success', message: res.message });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    }
  }

  return (
    <div className="flex flex-col items-start gap-5">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        aria-describedby="ping-result"
        className="inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-full bg-accent px-7 text-[1.0625rem] font-semibold text-on-accent shadow-[0_6px_20px_-8px_var(--accent)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_10px_28px_-10px_var(--accent)] active:translate-y-0 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none">
        {loading && (
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-on-accent border-t-transparent motion-reduce:animate-none"
          />
        )}
        {loading ? 'Calling the API…' : status.kind === 'error' ? 'Try again' : 'Call the API'}
      </button>

      <p
        id="ping-result"
        aria-live="polite"
        className={`min-h-6 text-base ${
          status.kind === 'success'
            ? 'text-success'
            : status.kind === 'error'
              ? 'text-danger'
              : 'text-ink-muted'
        }`}>
        {resultText(status)}
      </p>
    </div>
  );
}

function resultText(status: Status): string {
  switch (status.kind) {
    case 'idle':
      return 'Click the button to test the API connection.';
    case 'loading':
      return 'Waiting for a response…';
    case 'success':
      return status.message;
    case 'error':
      return status.message;
  }
}
