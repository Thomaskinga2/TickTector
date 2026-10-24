// Date formatting for display, always in the device's locale and time zone.

const day = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", opts);

// "2026-10-18" (a Sunday) -> "Oct 18 – 24", "Oct 25 – 31", "Nov 29 – Dec 5", or "Dec 27, 2026 – Jan 2, 2027".
export function formatWeekRange(sundayIso: string) {
  const start = new Date(`${sundayIso}T12:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  if (start.getFullYear() !== end.getFullYear()) {
    const full: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    return `${day(start, full)} – ${day(end, full)}`;
  }
  const startLabel = day(start, { month: "short", day: "numeric" });
  const endLabel = start.getMonth() === end.getMonth() ? end.getDate() : day(end, { month: "short", day: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

// "Just now", "5 min ago", "3 hr ago", "Yesterday", "Tuesday", or "Oct 12" for older dates.
export function formatRelative(iso: string, now = new Date()) {
  const date = new Date(iso);
  const minutes = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60 && date.getDate() === now.getDate()) return `${Math.round(minutes / 60)} hr ago`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.ceil((startOfToday.getTime() - date.getTime()) / 86_400_000);
  if (days <= 1) return "Yesterday";
  if (days < 7) return day(date, { weekday: "long" });
  return day(date, { month: "short", day: "numeric", year: date.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}
