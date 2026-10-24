"use client";

import { useEffect, useState } from "react";

type Settled<T> = { key: unknown[]; data?: T; error: string | null };

const sameKey = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

// Runs a service call and tracks loading/error. Spread the rest into a component:
//   const { data, ...slot } = useAsync(() => getWeeklyRisk(id), [id]);
//   <RiskGauge risk={data} {...slot} />
// Loading is derived (the last settled call was for other deps), so the effect never sets state synchronously.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = [...deps, attempt];

  useEffect(() => {
    let cancelled = false;
    fn().then(
      (result) => {
        if (!cancelled) setSettled({ key, data: result, error: null });
      },
      (err: unknown) => {
        if (cancelled) return;
        const error = err instanceof Error ? err.message : "Something went wrong";
        setSettled((prev) => ({ key, data: prev?.data, error }));
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, key);

  const current = settled !== null && sameKey(settled.key, key);
  return { data: settled?.data, loading: !current, error: current ? settled.error : null, onRetry: () => setAttempt((n) => n + 1) };
}
