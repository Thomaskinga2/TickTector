import { RISK_BG } from "@/components/risk-badge";
import { ComingSoon, slotStatus, type SlotProps } from "@/components/states";
import { features } from "@/lib/features";
import type { HeatmapPoint, RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

// Massachusetts bounding box, used to place points on the placeholder grid.
const BOUNDS = { north: 42.9, south: 41.2, west: -73.5, east: -69.9 };

// TODO: replace the placeholder grid with a real map (e.g. react-leaflet) once a map library is approved.
export function Heatmap({
  points,
  compact = false,
  ...slot
}: { points?: HeatmapPoint[]; compact?: boolean } & SlotProps) {
  if (!features.heatmap) return <ComingSoon title="Risk map">A map of tick risk across Massachusetts is coming soon.</ComingSoon>;
  const status = slotStatus(slot, !points?.length, "No map data yet.");
  if (status || !points) return status;

  return (
    <div
      role="img"
      aria-label="Tick risk across Massachusetts"
      className={cn(
        "relative w-full overflow-hidden rounded-lg border bg-card",
        "bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-size-[24px_24px]",
        compact ? "aspect-[16/10]" : "min-h-80 flex-1",
      )}
    >
      {points.map((p) => (
        <span
          key={p.townId}
          title={`${p.townId}: ${Math.round(p.value * 100)}%`}
          className={cn("absolute -translate-1/2 rounded-full opacity-70", RISK_BG[toLevel(p.value)])}
          style={{
            left: `${((p.lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 100}%`,
            top: `${((BOUNDS.north - p.lat) / (BOUNDS.north - BOUNDS.south)) * 100}%`,
            width: `${(compact ? 16 : 28) + p.value * (compact ? 16 : 32)}px`,
            aspectRatio: "1",
          }}
        />
      ))}
    </div>
  );
}

function toLevel(value: number): RiskLevel {
  return value >= 0.7 ? "high" : value >= 0.4 ? "moderate" : "low";
}
