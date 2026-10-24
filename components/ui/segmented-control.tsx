"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Segment<T extends string> = { value: T; label: ReactNode; accessibleLabel?: string; disabled?: boolean };

// iOS segmented control (HIG): equal-width segments in a gray track, the selection pill sliding on a spring.
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  className,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const index = Math.max(0, segments.findIndex((s) => s.value === value));

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("relative grid h-9 rounded-full bg-fill p-0.5", className)}
      style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 rounded-full bg-[var(--segment-selected)] shadow-[0_3px_8px_rgb(0_0_0/0.12),0_1px_1px_rgb(0_0_0/0.04)] transition-transform duration-500 ease-spring motion-reduce:transition-none"
        style={{ width: `calc((100% - 4px) / ${segments.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            aria-pressed={selected}
            aria-label={segment.accessibleLabel}
            disabled={segment.disabled}
            onClick={() => onChange(segment.value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-full px-2 type-subhead transition-colors disabled:opacity-35",
              selected ? "font-semibold text-foreground" : "font-medium text-foreground/80",
            )}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
