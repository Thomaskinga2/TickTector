"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { Expand, Map as MapIcon } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import { ComingSoon, LoadingState, slotStatus, type SlotProps } from "@/components/states";
import { features } from "@/lib/features";
import { RISK_LEVELS, type HeatmapPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

const RiskMapCanvas = dynamic(() => import("@/components/risk-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center">
      <LoadingState label="Loading map…" />
    </div>
  ),
});

// `compact` is the static preview on town pages: no panning or tapping, so a wrapping link gets the tap.
// `hint` floats in the map's top-left corner; `children` render right under the map (the selected town's card).
export function Heatmap({
  points,
  compact = false,
  selectedId = null,
  onSelect,
  hint,
  children,
  focusId,
  ...slot
}: {
  points?: HeatmapPoint[];
  compact?: boolean;
  selectedId?: string | null;
  onSelect?: (townId: string) => void;
  hint?: ReactNode;
  children?: ReactNode;
  // Compact only: frame this town and its nearest neighbors instead of the whole state.
  focusId?: string;
} & SlotProps) {
  if (!features.heatmap) return (
      <ComingSoon title="Risk map is coming soon" icon={MapIcon}>
        A map of tick risk across Massachusetts.
      </ComingSoon>
    );
  const status = slotStatus(slot, !points?.length, "No towns to show.");
  if (status || !points) return status;

  return (
    <div className="flex flex-col gap-3">
      <div
        role={compact ? undefined : "region"}
        aria-label={compact ? undefined : "Map of tick risk by town"}
        aria-hidden={compact || undefined}
        // isolate keeps Leaflet's z-indexes (up to 1000) under the fixed bottom nav.
        className={cn(
          "risk-map relative isolate overflow-hidden rounded-xl bg-fill",
          // Massachusetts is wide and short; a tall frame leaves it small with empty space above and below.
          // In landscape the frame is capped to the room between the nav bar and the tab bar, so it fits on screen.
          compact
            ? "is-compact aspect-[16/10] max-h-[max(10rem,calc(100dvh-7.5rem))]"
            : "aspect-[3/2] max-h-[min(560px,calc(100dvh-7.5rem))] min-h-64",
        )}
      >
        <RiskMapCanvas
          points={points}
          compact={compact}
          focusId={focusId}
          selectedId={compact ? (focusId ?? null) : selectedId}
          onSelect={onSelect}
        />
        {compact && (
          <span className="glass pointer-events-none absolute right-2.5 bottom-2.5 z-[1100] inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 type-footnote font-semibold text-[#000]">
            <Expand className="size-3.5" strokeWidth={2.4} aria-hidden />
            Open map
          </span>
        )}
        {hint && <div className="pointer-events-none absolute top-3 left-3 z-[1100]">{hint}</div>}
      </div>
      {children}
      {!compact && (
        <ul aria-label="Legend" className="flex flex-wrap gap-x-5 gap-y-1 px-1">
          {RISK_LEVELS.map((level) => (
            <li key={level}>
              <RiskBadge level={level} className="text-muted-foreground" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
