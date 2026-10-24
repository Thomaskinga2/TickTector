// Each tick species drawn from above in its real markings, so the three are easy to tell apart at a glance
// (Mass. DPH and CDC tick identification). Body size follows the adults: the deer tick is the smallest.
type Look = { body: string; shield: string; legs: string; scale: number; mark?: "spot" | "marbled" };

const LOOKS: Record<string, Look> = {
  // Blacklegged (deer) tick: orange-red body, solid black shield and legs, small.
  "deer-tick": { body: "#b4532f", shield: "#1f1a17", legs: "#1f1a17", scale: 0.82 },
  // American dog tick: brown, with a cream-marbled shield, the largest.
  "dog-tick": { body: "#6e4a2e", shield: "#5a3b22", legs: "#4a3220", scale: 1, mark: "marbled" },
  // Lone star tick: red-brown, one white spot on the shield.
  "lone-star-tick": { body: "#8c4426", shield: "#733a20", legs: "#4a2a18", scale: 0.94, mark: "spot" },
  // Woodchuck (groundhog) tick: tan body, red-brown shield and legs.
  "woodchuck-tick": { body: "#b98a5a", shield: "#7a3b1e", legs: "#7a3b1e", scale: 0.86 },
};
const FALLBACK: Look = { body: "#6e4a2e", shield: "#4a3220", legs: "#4a3220", scale: 0.9 };

const LEFT_LEGS = "M14 14 Q8 10 6 5 M13 17 Q7 15 3 12 M13 20 Q7 21 3 24 M14 23 Q8 26 6 31";

export function TickSpeciesIcon({ speciesId, className }: { speciesId: string; className?: string }) {
  const look = LOOKS[speciesId] ?? FALLBACK;
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      <g transform={`translate(18 18) scale(${look.scale}) translate(-18 -18)`}>
        <g fill="none" stroke={look.legs} strokeWidth={1.6} strokeLinecap="round">
          <path d={LEFT_LEGS} />
          <path d={LEFT_LEGS} transform="matrix(-1 0 0 1 36 0)" />
        </g>
        <path d="M16 4h4l1 5h-6z" fill={look.legs} />
        <ellipse cx={18} cy={22} rx={8} ry={10} fill={look.body} />
        <ellipse cx={18} cy={15} rx={5.5} ry={5} fill={look.shield} />
        {look.mark === "spot" && <circle cx={18} cy={17} r={1.9} fill="#f6efe2" />}
        {look.mark === "marbled" && (
          <path d="M14 13q2-2 4 0t4 0M14.5 16.5q1.5 1.5 3 0M19 17q1.5-1 2.5.5" fill="none" stroke="#efe4cc" strokeWidth={1.3} strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}
