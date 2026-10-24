"use client";

import { useState, type ReactNode } from "react";
import { RISK_BG, RISK_LABEL } from "@/components/risk-badge";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

// Hand-drawn charts (no chart library). Rules from the dataviz skill: thin marks, rounded data ends,
// recessive axes, text in ink colors, a legend for 2+ series, a screen-reader table for every chart.

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

export function ChartCard({ title, takeaway, children, footnote }: { title: string; takeaway?: string; children: ReactNode; footnote?: ReactNode }) {
  return (
    <figure className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <figcaption className="flex flex-col gap-1">
        <span className="font-semibold">{title}</span>
        {takeaway && <span className="text-sm text-muted-foreground">{takeaway}</span>}
      </figcaption>
      {children}
      {footnote && <p className="text-xs text-muted-foreground">{footnote}</p>}
    </figure>
  );
}

export function Legend({ items }: { items: { label: string; className: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-4 rounded-sm", i.className, i.dashed && "h-0.5 border-t-2 border-dashed bg-transparent")} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

// Ranking: one horizontal bar per row, colored by risk level, with the level written out (never color alone).
export function RankBars({
  rows,
  unit,
  onSelect,
}: {
  rows: { id: string; label: string; value: number; level: RiskLevel }[];
  unit: string;
  onSelect?: (id: string) => void;
}) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ol className="flex flex-col">
      {rows.map((r) => (
        <li key={r.id}>
          <button
            type="button"
            onClick={() => onSelect?.(r.id)}
            className="grid min-h-11 w-full grid-cols-[7.5rem_1fr] items-center gap-3 rounded-md px-1 text-left hover:bg-muted"
            aria-label={`${r.label}: ${fmt(r.value)} ${unit}, ${RISK_LABEL[r.level]} risk`}
          >
            <span className="truncate text-sm">{r.label}</span>
            <span className="flex items-center gap-2">
              <span className={cn("h-3 rounded-r-[4px]", RISK_BG[r.level])} style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {Math.round(r.value)} {RISK_LABEL[r.level]}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

// Single-series bars over years (use one per disease as small multiples: each gets its own scale).
// Nulls leave a gap; partial years are drawn lighter.
export function YearBars({
  label,
  data,
  unit,
}: {
  label: string;
  data: { x: string; value: number | null; partial?: boolean }[];
  unit: string;
}) {
  const latest = [...data].reverse().find((d) => d.value !== null);
  const [active, setActive] = useState<string | null>(null);
  const shown = data.find((d) => d.x === active) ?? latest;
  const max = Math.max(1, ...data.map((d) => d.value ?? 0));
  const W = 320;
  const H = 96;
  const step = W / data.length;
  const barW = Math.max(3, step - 4); // 2px surface gap each side

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground" aria-live="polite">
          {shown && (shown.value === null ? `${shown.x}: no data` : `${shown.x}${shown.partial ? " (so far)" : ""}: ${fmt(shown.value)} ${unit}`)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full" role="img" aria-label={`${label}, ${unit} per year`}>
        <line x1={0} x2={W} y1={H} y2={H} stroke="var(--border)" />
        {data.map((d, i) => {
          const h = d.value === null ? 0 : Math.max(1, (d.value / max) * (H - 4));
          const x = i * step + (step - barW) / 2;
          const r = Math.min(4, h, barW / 2); // rounded data end, square at the baseline
          return (
            <g key={d.x}>
              {d.value !== null && (
                <path
                  d={`M${x} ${H}V${H - h + r}q0 ${-r} ${r} ${-r}h${barW - 2 * r}q${r} 0 ${r} ${r}V${H}Z`}
                  fill="var(--series-place)"
                  opacity={d.partial ? 0.45 : shown?.x === d.x ? 1 : 0.85}
                />
              )}
              {/* Hit target taller and wider than the bar. */}
              <rect
                x={i * step}
                y={0}
                width={step}
                height={H + 16}
                fill="transparent"
                onPointerEnter={() => setActive(d.x)}
                onClick={() => setActive(d.x)}
              />
            </g>
          );
        })}
        {[data[0], data[data.length - 1]].map((d, i) => (
          <text key={d.x} x={i === 0 ? 0 : W} y={H + 13} fontSize={11} textAnchor={i === 0 ? "start" : "end"} fill="var(--muted-foreground)">
            {d.x}
          </text>
        ))}
      </svg>
      <DataTable caption={`${label} (${unit})`} head={["Year", unit]} rows={data.map((d) => [d.x, d.value === null ? "no data" : fmt(d.value)])} />
    </div>
  );
}

// Place vs. state for a few categories: two thin bars per row with values written out.
export function CompareBars({
  rows,
  placeLabel,
  unit,
}: {
  rows: { label: string; place: number | null; state: number | null }[];
  placeLabel: string;
  unit: string;
}) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.place ?? 0, r.state ?? 0]));
  const bar = (v: number | null, cls: string) => (
    <span className="flex items-center gap-2">
      <span className={cn("h-2.5 rounded-r-[4px]", cls)} style={{ width: `${v === null ? 0 : Math.max(1, (v / max) * 100)}%` }} />
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{v === null ? "no data" : fmt(v)}</span>
    </span>
  );
  return (
    <div className="flex flex-col gap-3">
      <Legend items={[{ label: placeLabel, className: "bg-series-place" }, { label: "Massachusetts", className: "bg-series-state" }]} />
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1">
          <span className="text-sm">{r.label}</span>
          {bar(r.place, "bg-series-place")}
          {bar(r.state, "bg-series-state")}
        </div>
      ))}
      <DataTable caption={unit} head={["", placeLabel, "Massachusetts"]} rows={rows.map((r) => [r.label, r.place === null ? "no data" : fmt(r.place), r.state === null ? "no data" : fmt(r.state)])} />
    </div>
  );
}

// Place line vs. state reference line over periods. One axis, shared scale.
export function CompareLines({
  data,
  placeLabel,
  unit,
}: {
  data: { x: string; place: number | null; state: number }[];
  placeLabel: string;
  unit: string;
}) {
  const [active, setActive] = useState(data.length - 1);
  const W = 320;
  const H = 110;
  const PAD = 10;
  const max = Math.max(1, ...data.flatMap((d) => [d.place ?? 0, d.state])) * 1.1;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, data.length - 1);
  const y = (v: number) => H - (v / max) * (H - 8);
  const line = (key: "place" | "state") =>
    data
      .map((d, i) => (d[key] === null ? null : `${x(i)} ${y(d[key] as number)}`))
      .filter(Boolean)
      .map((p, i) => `${i ? "L" : "M"}${p}`)
      .join("");
  const a = data[active];

  return (
    <div className="flex flex-col gap-2">
      <Legend items={[{ label: placeLabel, className: "bg-series-place" }, { label: "Massachusetts", className: "border-series-state", dashed: true }]} />
      <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
        {a.x}: {a.place === null ? "no data" : fmt(a.place)} vs {fmt(a.state)} {unit}
      </p>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={`${placeLabel} vs Massachusetts, ${unit}`}>
        <line x1={0} x2={W} y1={H} y2={H} stroke="var(--border)" />
        <line x1={x(active)} x2={x(active)} y1={0} y2={H} stroke="var(--border)" />
        <path d={line("state")} fill="none" stroke="var(--series-state)" strokeWidth={2} strokeDasharray="5 4" />
        <path d={line("place")} fill="none" stroke="var(--series-place)" strokeWidth={2} />
        {data.map((d, i) => (
          <g key={d.x}>
            {d.place !== null && (
              <circle cx={x(i)} cy={y(d.place)} r={i === active ? 5 : 3.5} fill="var(--series-place)" stroke="var(--card)" strokeWidth={2} />
            )}
            <rect
              x={x(i) - (W - PAD * 2) / Math.max(1, data.length - 1) / 2}
              y={0}
              width={(W - PAD * 2) / Math.max(1, data.length - 1)}
              height={H + 18}
              fill="transparent"
              onPointerEnter={() => setActive(i)}
              onClick={() => setActive(i)}
            />
          </g>
        ))}
        {[0, data.length - 1].map((i) => (
          <text key={i} x={i === 0 ? 0 : W} y={H + 14} fontSize={11} textAnchor={i === 0 ? "start" : "end"} fill="var(--muted-foreground)">
            {data[i].x}
          </text>
        ))}
      </svg>
      <DataTable caption={unit} head={["Period", placeLabel, "Massachusetts"]} rows={data.map((d) => [d.x, d.place === null ? "no data" : fmt(d.place), fmt(d.state)])} />
    </div>
  );
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
