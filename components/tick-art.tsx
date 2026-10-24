// A tick drawn in SVG, ported from drawTick in reference/capture-preview.html.
// Used on Tickdex cards when a catch has no photo, and (in one flat colour) as the empty-slot silhouette.
import type { TickStage, TickdexCatch } from "@/lib/tickdex";

type Engorgement = TickdexCatch["engorgement"];

type Palette = { body: string; fedBody: string; highlight: string; shield: string; legs: string };

const PALETTES: Record<string, Palette> = {
  "deer-tick": { body: "#7a2e14", fedBody: "#8a7570", highlight: "#a5461f", shield: "#18110d", legs: "#1a1310" },
  "dog-tick": { body: "#6b4a2e", fedBody: "#9a8e80", highlight: "#8f6a45", shield: "#3a2a1c", legs: "#2e2116" },
  "lone-star-tick": { body: "#8a3b1d", fedBody: "#8f7c74", highlight: "#b0592c", shield: "#4a2a18", legs: "#2f1d12" },
  unknown: { body: "#6d5d4f", fedBody: "#8d8378", highlight: "#8a7766", shield: "#2a221c", legs: "#2a221c" },
};

const FED: Record<Engorgement, number> = { flat: 0.1, "partly fed": 0.5, engorged: 0.95 };
const STAGE_SCALE: Record<TickStage, number> = { larva: 0.5, nymph: 0.7, adult: 0.88 };

function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function legPoints(side: number, i: number): string {
  const by = -9 + i * 5.5;
  return [
    [side * 8, by],
    [side * (19 + (i % 2) * 2), by - 7 + i * 3],
    [side * (27 - i), by - 2 + i * 5.5],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

const deg = (rad: number) => (rad * 180) / Math.PI;

export function TickArt({
  speciesId,
  stage,
  engorgement = "flat",
  silhouette,
  className,
}: {
  speciesId: string;
  stage: TickStage;
  engorgement?: Engorgement;
  silhouette?: string; // one flat colour for the whole tick (empty slot)
  className?: string;
}) {
  const p = PALETTES[speciesId] ?? PALETTES.unknown;
  const fed = silhouette ? 0.1 : FED[engorgement];
  const legs = stage === "larva" ? 3 : 4; // larvae have six legs
  const fill = (color: string) => silhouette ?? color;
  const bodyY = 7 + fed * 3;

  return (
    <svg viewBox="-36 -32 72 72" className={className} aria-hidden>
      <g transform={`translate(0 -3) scale(${STAGE_SCALE[stage]})`}>
        <g stroke={fill(p.legs)} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {[-1, 1].flatMap((side) =>
            Array.from({ length: legs }, (_, i) => <polyline key={`${side}-${i}`} points={legPoints(side, i)} />),
          )}
        </g>
        <ellipse cx={0} cy={bodyY} rx={14.5 + fed * 4} ry={18.5 + fed * 6} fill={fill(mix(p.body, p.fedBody, fed))} />
        {!silhouette && (
          <>
            <ellipse cx={-4} cy={9} rx={5} ry={9} transform={`rotate(${deg(-0.2)} -4 9)`} fill={p.highlight} opacity={0.45 * (1 - fed * 0.5)} />
            <ellipse cx={-6} cy={4 + fed * 3} rx={4} ry={8} transform={`rotate(${deg(-0.3)} -6 ${4 + fed * 3})`} fill="#ffffff" opacity={0.28 * fed} />
          </>
        )}
        <ellipse cx={0} cy={-7} rx={10} ry={9.5} fill={fill(p.shield)} />
        <polygon points="-4,-14 0,-24 4,-14" fill={fill(p.shield)} />
        {!silhouette && speciesId === "dog-tick" && (
          <g fill="#e8dcc0" opacity={0.85}>
            <ellipse cx={-4} cy={-8} rx={2.6} ry={1.6} />
            <ellipse cx={4} cy={-6} rx={2.2} ry={1.4} />
            <ellipse cx={0} cy={-3} rx={1.6} ry={1.2} />
          </g>
        )}
        {!silhouette && speciesId === "lone-star-tick" && stage === "adult" && <circle cx={0} cy={-4} r={2.6} fill="#f6efe0" />}
      </g>
    </svg>
  );
}
