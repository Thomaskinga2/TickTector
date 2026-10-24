"use client";

import { useEffect, useState } from "react";

// Runs a service call and tracks loading/error. Spread the rest into a component:
//   const { data, ...slot } = useAsync(() => getWeeklyRisk(id), [id]);
//   <RiskGauge risk={data} {...slot} />
// Loading is derived (the latest result belongs to an older request), so the effect never sets state synchronously.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([...deps, attempt]);
  const [result, setResult] = useState<{ key: string | null; data?: T; error: string | null }>({ key: null, error: null });

  useEffect(() => {
    let cancelled = false;
    fn().then(
      (data) => {
        if (!cancelled) setResult({ key, data, error: null });
      },
      (err: unknown) => {
        if (!cancelled)
          setResult((prev) => ({ key, data: prev.data, error: err instanceof Error ? err.message : "Something went wrong" }));
      },
    );
    return () => {
      cancelled = true;
    };
    // `key` encodes deps and retries; `fn` is a fresh closure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const settled = result.key === key;
  return {
    data: result.data,
    loading: !settled,
    error: settled ? result.error : null,
    onRetry: () => setAttempt((n) => n + 1),
  };
}
