import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

// Each level as a little round face: content at Low, unsure at Moderate, worried (with a sweat drop) at High.
// A shape for the level beside its word, never instead of it. Not Tick: the mascot never encodes risk.
export function LevelFace({ level, size = 40, className }: { level: RiskLevel; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden className={cn("level-face shrink-0", `level-face--${level}`, className)}>
      <circle cx="20" cy="20" r="19" className="level-face-fill" />
      {/* Cheeks. */}
      <ellipse cx="10.5" cy="23.5" rx="3.2" ry="2" className="level-face-cheek" />
      <ellipse cx="29.5" cy="23.5" rx="3.2" ry="2" className="level-face-cheek" />
      <g className="level-face-ink">
        {level === "low" && (
          <>
            {/* Eyes closed in a happy curve, a wide smile. */}
            <path d="M12.5 18.5q2.5-3 5 0M22.5 18.5q2.5-3 5 0" />
            <path d="M15 24.5q5 4.5 10 0" />
          </>
        )}
        {level === "moderate" && (
          <>
            {/* Dot eyes, one brow up, a wavering mouth. */}
            <circle cx="15" cy="18.5" r="1.7" className="level-face-dot" />
            <circle cx="25" cy="18.5" r="1.7" className="level-face-dot" />
            <path d="M22.5 13.5l4.5-1.2" />
            <path d="M15.5 26q2.2-1.6 4.5 0t4.5 0" />
          </>
        )}
        {level === "high" && (
          <>
            {/* Worried brows, wide eyes, a little frown and a sweat drop. */}
            <path d="M11.5 16l4.5-2M28.5 16l-4.5-2" />
            <circle cx="15" cy="19.5" r="1.9" className="level-face-dot" />
            <circle cx="25" cy="19.5" r="1.9" className="level-face-dot" />
            <path d="M16 27.5q4-3.5 8 0" />
            <path d="M32.5 8.5q-2.4 3.4-2.4 4.9a2.4 2.4 0 0 0 4.8 0q0-1.5-2.4-4.9z" className="level-face-drop" />
          </>
        )}
      </g>
    </svg>
  );
}
