// Simple top-down tick drawings, one per species id. Colors follow each tick's real markings.
const LOOKS: Record<string, { body: string; shield: string; legs: string; mark?: "dot" | "mottled" }> = {
  "deer-tick": { body: "#a1442b", shield: "#1f1a17", legs: "#1f1a17" }, // red-orange body, black shield
  "dog-tick": { body: "#6b4a2f", shield: "#6b4a2f", legs: "#4a3220", mark: "mottled" }, // brown, cream-marbled shield
  "lone-star-tick": { body: "#8a4b2a", shield: "#7a3f22", legs: "#4a2a18", mark: "dot" }, // red-brown, one white spot
};
const FALLBACK = { body: "#6b4a2f", shield: "#4a3220", legs: "#4a3220" };

const LEFT_LEGS = "M14 14 Q8 10 6 5 M13 17 Q7 15 3 12 M13 20 Q7 21 3 24 M14 23 Q8 26 6 31";

export function TickIcon({ speciesId, className }: { speciesId: string; className?: string }) {
  const look = LOOKS[speciesId] ?? FALLBACK;
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      <g fill="none" stroke={look.legs} strokeWidth={1.6} strokeLinecap="round">
        <path d={LEFT_LEGS} />
        <path d={LEFT_LEGS} transform="matrix(-1 0 0 1 36 0)" />
      </g>
      <path d="M16 4 h4 l1 5 h-6 z" fill={look.legs} />
      <ellipse cx={18} cy={22} rx={8} ry={10} fill={look.body} />
      <ellipse cx={18} cy={15} rx={5.5} ry={5} fill={look.shield} />
      {look.mark === "dot" && <circle cx={18} cy={17} r={1.8} fill="#f5efe2" />}
      {look.mark === "mottled" && (
        <path d="M14 13 q2 -2 4 0 q2 2 4 0 M14.5 16.5 q1.5 1.5 3 0 M19 17 q1.5 -1 2.5 0.5" fill="none" stroke="#efe4cc" strokeWidth={1.3} strokeLinecap="round" />
      )}
    </svg>
  );
}
