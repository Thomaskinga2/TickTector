import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

// Ticks wait at the tips of tall grass for someone to brush past, so the town page's meadow grows with the level:
// trimmed at Low (with a few daisies), knee-high at Moderate, tall and swaying at High. Decoration beside the level's
// word, never instead of it.
type Grow = RiskLevel | "none";
const HEIGHT: Record<Grow, number> = { none: 0.3, low: 0.38, moderate: 0.68, high: 1 };
const BLADES = 30;
const W = 360;
const H = 64;

// Fixed pseudo-random numbers, so the meadow is the same on the server, on every render and every visit.
const jitter = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function row(back: boolean, grow: number) {
  const seed = back ? 11 : 0;
  let d = "";
  for (let i = 0; i < BLADES; i++) {
    const x = (i + (back ? 0 : 0.5) + (jitter(i, seed) - 0.5) * 0.7) * (W / (BLADES - 1));
    const h = (22 + jitter(i, seed + 3) * 34) * grow * (back ? 1.08 : 0.86);
    const w = 3.2 + jitter(i, seed + 5) * 2.6;
    const lean = (jitter(i, seed + 7) - 0.5) * 16;
    const top = H - h;
    d += `M${(x - w).toFixed(1)} ${H}Q${(x - w * 0.4 + lean * 0.4).toFixed(1)} ${(H - h * 0.55).toFixed(1)} ${(x + lean).toFixed(1)} ${top.toFixed(1)}Q${(x + w * 0.4 + lean * 0.4).toFixed(1)} ${(H - h * 0.55).toFixed(1)} ${(x + w).toFixed(1)} ${H}Z`;
  }
  return d;
}

// Built once per level when the module loads.
const ROWS = Object.fromEntries(
  (Object.keys(HEIGHT) as Grow[]).map((g) => [g, { back: row(true, HEIGHT[g]), front: row(false, HEIGHT[g]) }]),
) as Record<Grow, { back: string; front: string }>;
const DAISIES = [34, 101, 176, 243, 318].map((x, i) => ({ x, y: H - 17 - jitter(i, 21) * 6 }));

export function Meadow({ level, className }: { level?: RiskLevel; className?: string }) {
  const grow = level ?? "none";
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      className={cn("meadow block h-16 w-full", `meadow--${grow}`, className)}
    >
      <path d={ROWS[grow].back} className="meadow-back" />
      <path d={ROWS[grow].front} className="meadow-front" />
      {grow === "low" &&
        DAISIES.map(({ x, y }) => (
          <g key={x} className="meadow-daisy" transform={`translate(${x} ${y.toFixed(1)})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-2.6" rx="1.6" ry="2.4" transform={`rotate(${a})`} />
            ))}
            <circle r="1.5" className="meadow-daisy-eye" />
          </g>
        ))}
    </svg>
  );
}
