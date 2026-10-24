"use client";

import Link from "next/link";
import * as m from "motion/react-m";
import { ChevronRight } from "lucide-react";
import { formatWeekRange } from "@/components/format";
import { LevelFace } from "@/components/level-face";
import { Radar, type RadarBlip } from "@/components/radar";
import { Tick } from "@/components/tick";
import radarMap from "@/lib/data/radar-map.json";
import { smooth, springy } from "@/lib/motion";
import { RISK_LEVELS, type CountyRisk } from "@/lib/types";

// Massachusetts in the scope (US Census boundaries, scripts/build-radar-map.mjs): each DPH county group's blip sits
// at the middle of its towns, on the map.
const CENTERS = new Map(Object.entries(radarMap.centers).map(([county, [x, y]]) => [county, { x, y }]));

const LABEL = { high: "High", moderate: "Moderate", low: "Low" } as const;

// Home's hero: Tick's radar over a map of Massachusetts, with this week's case file in a speech bubble. One blip per
// DPH county group at its real place, in its level's color; Tick keeps watch from the scope's rim, so it never covers
// a county. The counts are this week's levels. Tap to open the map.
export function RadarCard({ risks, week }: { risks: CountyRisk[]; week?: string }) {
  const blips: RadarBlip[] = risks.flatMap((r) => {
    const at = CENTERS.get(r.county);
    return at ? [{ id: r.county, x: at.x, y: at.y, level: r.level }] : [];
  });
  const count = (level: CountyRisk["level"]) => risks.filter((r) => r.level === level).length;
  const levels = [...RISK_LEVELS].reverse();
  const summary = levels.map((l) => `${count(l)} ${l}`).join(", ");

  return (
    <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.98 }} transition={springy}>
      <Link
        href="/map"
        aria-label={`Tick's radar${week ? `, week of ${formatWeekRange(week)}` : ""}: ${summary} of ${risks.length} county groups. Open the map.`}
        className="radar-card soft-block flex items-center gap-3.5 p-4"
      >
        <Radar size={136} blips={blips} map={radarMap}>
          {/* Perched on the rim at the bottom-left, glass toward the map: watching the scope, never covering a county. */}
          <span className="absolute bottom-[2%] left-[2%]">
            <Tick size={34} motion="hello" />
          </span>
        </Radar>
        <span className="flex min-w-0 flex-1 flex-col gap-2.5">
          {/* Tick's speech bubble: pops out of the radar once it has booted up. */}
          <m.span
            className="radar-bubble relative rounded-2xl rounded-bl-md px-3 py-2"
            initial={{ opacity: 0, scale: 0.6, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ ...springy, delay: 0.45 }}
            style={{ originX: 0, originY: 1 }}
          >
            <span className="block type-caption1 font-semibold opacity-70">
              Case file{week && <> · {formatWeekRange(week)}</>}
            </span>
            <span className="block type-footnote font-semibold">I checked all {risks.length} county groups.</span>
          </m.span>
          <span className="flex flex-col gap-1">
            {levels.map((level, i) => (
              <m.span
                key={level}
                className="flex items-center gap-2 type-subhead"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...smooth, delay: 0.55 + i * 0.06 }}
              >
                <LevelFace level={level} size={20} />
                <span className="font-semibold tabular-nums">{count(level)}</span>
                <span className="text-muted-foreground">{LABEL[level]}</span>
              </m.span>
            ))}
          </span>
          <span className="flex items-center gap-0.5 type-footnote font-semibold text-primary">
            Open the map
            <ChevronRight className="size-4" strokeWidth={2.6} aria-hidden />
          </span>
        </span>
      </Link>
    </m.div>
  );
}
