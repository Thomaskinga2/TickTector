"use client";

import type { CSSProperties, ReactNode } from "react";
import * as m from "motion/react-m";
import { springy } from "@/lib/motion";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

// x, y from -1 to 1 (north up). Colored by level: a blip is data, so it follows the risk colors.
export type RadarBlip = { id: string; x: number; y: number; level: RiskLevel };

// Blips keep their true direction but sit in the outer ring band, leaving the middle for whoever runs the radar.
// With a `map`, they sit at their true place on it instead.
const INNER = 0.38;

// SVG paths in the radar's -50..50 box (lib/data/radar-map.json, from scripts/build-radar-map.mjs).
export type RadarMap = { state: string; counties: string };

// Tick's radar. It boots up (rings draw in, then the beam starts), sweeps, and each blip pops in, then bounces
// and sends out a ripple whenever the beam passes it: every blip's pulse starts when the beam reaches its angle.
// `children` sits in the middle (Tick, turning to watch the beam when `followBeam` is set).
export function Radar({
  size = 120,
  blips = [],
  seconds = 4.5,
  followBeam = false,
  map,
  className,
  children,
}: {
  size?: number;
  blips?: RadarBlip[];
  map?: RadarMap;
  seconds?: number;
  followBeam?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const boot = blips.length ? 0.55 : 0;
  const spin = { "--spin": `${seconds}s`, "--spin-delay": `${boot}s` } as CSSProperties;
  return (
    <div aria-hidden className={cn("radar relative shrink-0 rounded-full", className)} style={{ width: size, height: size, ...spin }}>
      <svg viewBox="-50 -50 100 100" className="absolute inset-0 size-full">
        <circle r="49" className="radar-face" />
        {map && (
          <m.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <path d={map.state} className="radar-land" />
            <path d={map.counties} className="radar-county" />
          </m.g>
        )}
        {[18, 33.5, 49].map((r, i) => (
          <m.circle
            key={r}
            r={r}
            className="radar-line"
            initial={{ pathLength: boot ? 0 : 1, rotate: -90 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.08 }}
          />
        ))}
        <m.path
          d="M-49 0H49M0-49V49"
          className="radar-line"
          initial={{ pathLength: boot ? 0 : 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        />
      </svg>

      {/* The beam, Tick and the blips loop in CSS (globals.css, .radar-spin) on one clock set above; Motion's endless
          loops froze at their last frame here. */}
      <m.div
        className="radar-sweep radar-spin absolute inset-0 rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: boot }}
      />

      {blips.length > 0 && (
        <svg viewBox="-50 -50 100 100" className="absolute inset-0 size-full overflow-visible">
          {blips.map((b, i) => {
            const d = Math.hypot(b.x, b.y);
            const scale = map ? 50 : d ? ((INNER + (1 - INNER) * d) / d) * 41 : 0;
            const cx = b.x * scale;
            const cy = b.y * scale;
            // Clockwise from north, like the beam; the pulse waits for the beam to get there.
            const angle = ((Math.atan2(b.x, -b.y) * 180) / Math.PI + 360) % 360;
            const hit = { animationDelay: `${boot + (angle / 360) * seconds}s` };
            return (
              <m.g
                key={b.id}
                className={`radar-blip--${b.level}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...springy, delay: 0.3 + i * 0.05 }}
              >
                {/* Ripple: a ring that spreads out as the beam passes (CSS, on the beam's clock). */}
                <circle cx={cx} cy={cy} r={2} className="radar-ripple" style={hit} />
                {/* The blip itself: brightens and bounces when hit, then settles back to a glow. */}
                <circle cx={cx} cy={cy} r={b.level === "high" ? 2.4 : 2} className="radar-blip" style={hit} />
              </m.g>
            );
          })}
        </svg>
      )}

      {children && (
        <div className={cn("absolute inset-0 grid place-items-center", followBeam && "radar-spin")}>
          {children}
        </div>
      )}
    </div>
  );
}
