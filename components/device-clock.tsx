"use client";

import { useSyncExternalStore } from "react";

// Ticks once a minute, aligned to the minute boundary, using the device clock.
function subscribe(onChange: () => void) {
  let interval: ReturnType<typeof setInterval> | undefined;
  const timeout = setTimeout(() => {
    onChange();
    interval = setInterval(onChange, 60_000);
  }, 60_000 - (Date.now() % 60_000));
  return () => {
    clearTimeout(timeout);
    clearInterval(interval);
  };
}
const minuteNow = () => Math.floor(Date.now() / 60_000);
// Nothing on the server: the time shown is always the visitor's own.
const serverSnapshot = () => null;

// "Saturday, Oct 24 · 1:42 PM" in the device's locale and time zone.
export function DeviceClock({ className }: { className?: string }) {
  const minute = useSyncExternalStore(subscribe, minuteNow, serverSnapshot);
  if (minute === null) return <span className={className}>&nbsp;</span>;

  const now = new Date(minute * 60_000);
  const date = now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <time dateTime={now.toISOString()} className={className}>
      {date} · {time}
    </time>
  );
}
