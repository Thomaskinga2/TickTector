"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RISK_LABEL } from "@/components/risk-badge";
import { ComingSoon, slotStatus, type SlotProps } from "@/components/states";
import { features } from "@/lib/features";
import { getMapShapes } from "@/lib/services/heatmap";
import type { HeatmapPoint, RiskLevel } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

const FILL: Record<RiskLevel, string> = { low: "var(--risk-low)", moderate: "var(--risk-moderate)", high: "var(--risk-high)" };

// SVG risk map of all 351 towns (outlines: MassGIS; levels: county data). No map library, no tiles.
export function Heatmap({
  points,
  compact = false,
  county,
  selectedTownId,
  onSelectTown,
  ...slot
}: {
  points?: HeatmapPoint[];
  compact?: boolean;
  county?: string; // zoom to this county (MassGIS county name, e.g. "Hampshire")
  selectedTownId?: string | null;
  onSelectTown?: (townId: string) => void;
} & SlotProps) {
  const { data: shapes, ...shapeSlot } = useAsync(() => (features.heatmap ? getMapShapes() : Promise.resolve(null)), []);
  const ref = useRef<SVGSVGElement>(null);
  const [pxWidth, setPxWidth] = useState(343);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setPxWidth(entry.contentRect.width || 343));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shapes]);

  const byTown = useMemo(() => new Map(points?.map((p) => [p.townId, p])), [points]);

  if (!features.heatmap) return <ComingSoon title="Risk map">A map of tick risk across Massachusetts is coming soon.</ComingSoon>;
  const status =
    slotStatus({ ...slot, loading: slot.loading || shapeSlot.loading, error: slot.error ?? shapeSlot.error, onRetry: slot.onRetry }, !points?.length, "No map data yet.");
  if (status || !points || !shapes) return status;

  const box = shapes.counties.find((c) => c.name === county)?.bbox;
  const pad = box ? Math.max(box[2], box[3]) * 0.08 : 0;
  const view = box ? [box[0] - pad, box[1] - pad, box[2] + pad * 2, box[3] + pad * 2] : [0, 0, shapes.width, shapes.height];
  const unitsPerPx = view[2] / pxWidth;
  const selected = shapes.towns.find((t) => t.id === selectedTownId);

  return (
    <svg
      ref={ref}
      viewBox={view.join(" ")}
      className="w-full touch-manipulation select-none"
      style={{ aspectRatio: `${view[2]} / ${view[3]}` }}
      role="img"
      aria-label={county ? `Tick risk map of ${county} County` : "Tick risk map of Massachusetts by town"}
      onClick={(e) => {
        const id = (e.target as Element).getAttribute("data-town");
        if (id && onSelectTown) onSelectTown(id);
      }}
    >
      <g strokeLinejoin="round">
        {shapes.towns.map((t) => {
          const point = byTown.get(t.id);
          const level = point?.level;
          return (
            <path
              key={t.id}
              d={t.d}
              data-town={t.id}
              fillRule="evenodd"
              fill={level ? FILL[level] : "var(--muted)"}
              fillOpacity={selectedTownId && t.id !== selectedTownId ? 0.75 : 0.9}
              stroke="var(--card)"
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
              className={onSelectTown ? "cursor-pointer" : undefined}
            >
              <title>{point ? `${point.name}: ${RISK_LABEL[point.level]} risk` : "No data"}</title>
            </path>
          );
        })}
      </g>
      <path d={shapes.countyLines} fill="none" stroke="var(--primary)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" pointerEvents="none" />
      {selected && (
        <path d={selected.d} fillRule="evenodd" fill="none" stroke="var(--foreground)" strokeWidth={3} vectorEffect="non-scaling-stroke" pointerEvents="none" />
      )}
      {!compact || county ? (
        <g pointerEvents="none" fontWeight={600} textAnchor="middle" fill="var(--foreground)" stroke="var(--card)" strokeWidth={3 * unitsPerPx} paintOrder="stroke">
          {shapes.counties
            .filter((c) => !county || c.name === county)
            .map((c) => {
              // Keep labels near the right edge (Nantucket) inside the map.
              const nearRight = c.label[0] > view[0] + view[2] * 0.85;
              return (
                <text key={c.name} x={c.label[0]} y={c.label[1]} fontSize={12 * unitsPerPx} textAnchor={nearRight ? "end" : "middle"}>
                  {c.name}
                </text>
              );
            })}
        </g>
      ) : null}
    </svg>
  );
}

export function MapLegend() {
  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {(["high", "moderate", "low"] as RiskLevel[]).map((l) => (
          <li key={l} className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: FILL[l] }} aria-hidden />
            {RISK_LABEL[l]} risk
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Based on county data (MA DPH, 2025). Town outlines: MassGIS.</p>
    </div>
  );
}
