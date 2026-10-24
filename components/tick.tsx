import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type Mood = "happy" | "sleepy" | "puzzled";
// hello: hops in once, then now and then peeks through the glass. search: legs paddle and the glass sweeps (loading).
// wave: hops in, then waves the magnifying glass back and forth every few seconds (the logo).
// Every motion turns into a plain fade or nothing under Reduce Motion (app/globals.css).
type Motion = "hello" | "search" | "wave";

// Tick, TickTector's mascot: a female deer tick (dark shield on a clay body, eight legs), drawn round and friendly,
// holding up a detective's magnifying glass.
// Brand art only. Tick never encodes risk: its colors stay the same at every level, and it never sits on the readout.
// Moods: happy (default), sleepy for features that aren't awake yet, puzzled for errors and searches that miss.
export function Tick({
  size = 48,
  mood = "happy",
  motion,
  className,
  title,
}: {
  size?: number;
  mood?: Mood;
  motion?: Motion;
  className?: string;
  // Leave out for decoration (aria-hidden); pass when Tick stands alone and means something.
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("tick shrink-0", motion && `tick-motion-${motion}`, `tick-mood-${mood}`, className)}
    >
      <TickArt mood={mood} />
    </svg>
  );
}

// A small Tick for module headers, sized like the lucide symbols beside it.
export function TickSymbol({ className }: { className?: string }) {
  return <Tick size={20} className={cn("-my-1", className)} />;
}

// The drawing itself. scripts/make-icons.mjs keeps a copy for the app icons; change both together.
export function TickArt({ mood = "happy" }: { mood?: Mood }) {
  const leg: SVGProps<SVGPathElement> = {
    fill: "none",
    stroke: "var(--tick-leg, #3a2419)",
    strokeWidth: 2.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  return (
    <g className="tick-body">
      <g className="tick-legs-l">
        <path {...leg} d="M23 24 Q16 18 11 19" />
        <path {...leg} d="M21.5 29 Q14 26 8.5 28" />
        <path {...leg} d="M21.5 35 Q14 35.5 9 39" />
        <path {...leg} d="M23 41 Q17 45 13 50" />
      </g>
      <g className="tick-legs-r">
        <path {...leg} d="M42.5 29 Q50 26 55.5 28" />
        <path {...leg} d="M42.5 35 Q50 35.5 55 39" />
        <path {...leg} d="M41 41 Q47 45 51 50" />
      </g>
      {/* The detective's magnifying glass, held up in the front-right leg (which moves with the glass). */}
      <g className="tick-glass">
        <path {...leg} d="M41 24 Q44 22.6 45.6 21" />
        <path d="M45.4 21.2 L47.7 17.3" stroke="var(--tick-handle, #7a5232)" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="51.6" cy="11.8" r="6.2" fill="#d9eef3" fillOpacity="0.6" stroke="var(--tick-shield, #3a2419)" strokeWidth="2.2" />
        <path d="M48.6 10.6 Q49.4 8.4 51.4 8" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      </g>
      {/* Mouthparts */}
      <rect x="28.5" y="10" width="7" height="8" rx="3.2" fill="var(--tick-shield, #3a2419)" />
      {/* Body, with a soft vinyl highlight */}
      <ellipse cx="32" cy="37" rx="14" ry="16" fill="var(--tick-body, #b0643c)" />
      <ellipse cx="38.5" cy="43" rx="3.2" ry="5" fill="#fff" opacity="0.18" />
      {/* Shield (scutum) */}
      <ellipse cx="32" cy="26" rx="10.5" ry="9" fill="var(--tick-shield, #3a2419)" />
      {mood === "sleepy" ? (
        <g fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
          <path d="M25.6 25.4 Q28 27.4 30.4 25.4" />
          <path d="M33.6 25.4 Q36 27.4 38.4 25.4" />
        </g>
      ) : (
        <g className="tick-eyes">
          <ellipse cx="28" cy="25" rx="2.7" ry={mood === "puzzled" ? 2.2 : 3} fill="#fff" />
          <ellipse cx="36" cy="25" rx="2.7" ry="3" fill="#fff" />
          {/* Glancing up at the lens. */}
          <circle cx="28.9" cy="24.9" r="1.55" fill="#1d120c" />
          <circle cx="36.9" cy="24.9" r="1.55" fill="#1d120c" />
          <circle cx="29.4" cy="24.2" r="0.55" fill="#fff" />
          <circle cx="37.4" cy="24.2" r="0.55" fill="#fff" />
        </g>
      )}
      {mood === "puzzled" ? (
        <path d="M30 30.6 Q31 29.8 32 30.6 T34 30.6" fill="none" stroke="#f6dccb" strokeWidth="1.4" strokeLinecap="round" />
      ) : (
        <path d="M30 30 Q32 31.8 34 30" fill="none" stroke="#f6dccb" strokeWidth="1.4" strokeLinecap="round" />
      )}
      {/* Cheeks */}
      <ellipse cx="23.6" cy="36.5" rx="2.8" ry="1.7" fill="#ff9d9a" opacity="0.65" />
      <ellipse cx="40.4" cy="36.5" rx="2.8" ry="1.7" fill="#ff9d9a" opacity="0.65" />
      {mood === "sleepy" && (
        <g className="tick-zs" fill="var(--tick-mark, #6b8f7c)" fontFamily="ui-rounded, system-ui, sans-serif" fontWeight="700">
          <text x="13" y="13" fontSize="8">z</text>
          <text x="7" y="7" fontSize="6">z</text>
        </g>
      )}
      {mood === "puzzled" && (
        <text className="tick-question" x="7" y="15" fontSize="15" fontWeight="800" fill="var(--tick-mark, #6b8f7c)" fontFamily="ui-rounded, system-ui, sans-serif">
          ?
        </text>
      )}
    </g>
  );
}
