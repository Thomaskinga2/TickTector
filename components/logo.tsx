"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Tick } from "@/components/tick";
import { cn } from "@/lib/utils";

const LETTERS = [..."TickTect"];
// Set once the intro has played in this page load, so coming back to Home shows the logo already settled.
let introPlayed = false;
const at = (i: number) => ({ "--i": i }) as CSSProperties;

// The TickTector logo: Tick at the front, waving its magnifying glass, and the "o" in "Tector" drawn as the glass
// (its handle dips below the line like a descender). Sized in em, so it works as the large title and in the bar.
// Screen readers hear "TickTector".
// First load only: Tick hops in, the letters pop up one after another and the glass "o" rolls in last; when Tick
// first waves, the word ripples back once. After that only Tick's wave and the glint repeat, now and then.
export function Logo({ className, animate = true }: { className?: string; animate?: boolean }) {
  const [intro, setIntro] = useState(() => animate && !introPlayed);
  const root = useRef<HTMLSpanElement>(null);
  // Settle once the intro's last beat (the glass tilting back) ends, or as soon as it's cut short: Next keeps Home
  // mounted but hidden on other tabs, and a hidden element's CSS animations restart when it shows again.
  useEffect(() => {
    const el = root.current;
    if (!intro || !el) return;
    introPlayed = true;
    const settle = (e: AnimationEvent) => {
      if (e.type === "animationcancel" ? e.animationName.startsWith("logo-") : e.animationName === "logo-glass-tilt") setIntro(false);
    };
    el.addEventListener("animationend", settle);
    el.addEventListener("animationcancel", settle);
    return () => {
      el.removeEventListener("animationend", settle);
      el.removeEventListener("animationcancel", settle);
    };
  }, [intro]);

  return (
    <span ref={root} className={cn("inline-flex items-center", intro ? "logo-intro" : "logo-settled", className)}>
      <span className="sr-only">TickTector</span>
      <span aria-hidden className="inline-flex items-center">
        <Tick size={0} motion={animate ? "wave" : undefined} className="mr-[0.1em] -mb-[0.08em] h-[1.18em] w-[1.18em]" />
        {LETTERS.map((letter, i) => (
          <span key={i} className="logo-letter" style={at(i)}>
            {letter}
          </span>
        ))}
        <GlassO />
        <span className="logo-letter" style={at(LETTERS.length + 1)}>
          r
        </span>
      </span>
    </span>
  );
}

// A lowercase "o" as a magnifying glass: the lens matches a bold "o" at x-height and sits on the baseline,
// the handle angles down and right toward the "r". The logo shows twice on Home (large title and bar), so each
// copy gets its own clip id (a client component, so the two copies don't share one server-rendered id).
function GlassO() {
  const lens = useId();
  return (
    <svg viewBox="0 0 20 24" className="logo-glass -mr-[0.04em] ml-[0.02em] h-[0.98em] w-[0.74em] translate-y-[0.13em] overflow-visible" style={at(LETTERS.length)}>
      <defs>
        <clipPath id={lens}>
          <circle cx="8.6" cy="11.6" r="6.1" />
        </clipPath>
      </defs>
      <path d="M13 16.3 17.4 20.7" stroke="var(--tick-handle, #7a5232)" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="8.6" cy="11.6" r="6.1" fill="color-mix(in srgb, var(--tint) 14%, transparent)" />
      <g clipPath={`url(#${lens})`}>
        <rect className="logo-glint" x="6" y="2" width="3" height="20" fill="#fff" transform="rotate(25 8.6 11.6)" />
      </g>
      <circle cx="8.6" cy="11.6" r="6.1" fill="none" stroke="currentColor" strokeWidth="3.1" />
    </svg>
  );
}
