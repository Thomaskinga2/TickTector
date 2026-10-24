"use client";

import * as m from "motion/react-m";
import { formatRelative } from "@/components/format";
import { useCite } from "@/components/sources";
import { countyLabel } from "@/lib/counties";
import { smooth } from "@/lib/motion";
import type { RiskBasis, RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const MONTH_LONG = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });
const monthOf = (ym: string) => MONTH.format(new Date(`${ym}-01T00:00:00Z`));
// "Ticks can be out any time temperatures are above freezing."
const TICKS_ABOVE_FREEZING = { name: "Mass. DPH: Lyme disease", url: "https://www.mass.gov/info-details/lyme-disease" };

// "Why this level", short: two bars, the week's weather, and the rule in one line. The numbers are copied from the
// sources, which go to the page's footer (useCite).
export function RiskBasisDetails({ basis, level, townName }: { basis: RiskBasis; level: RiskLevel; townName: string }) {
  const { countyRate, stateRate, period, forecast } = basis;
  const max = Math.max(countyRate, stateRate);
  const range = `${monthOf(period.from)} – ${monthOf(period.to)} ${period.to.slice(0, 4)}`;
  const report = `${MONTH_LONG.format(new Date(`${period.to}-01T00:00:00Z`))} ${period.to.slice(0, 4)}`;
  useCite([
    { name: `Mass. DPH tick-borne disease report, ${report}`, url: basis.dph.url },
    ...(forecast ? [{ name: `NWS forecast for ${forecast.place}`, url: forecast.url }] : []),
    TICKS_ABOVE_FREEZING,
  ]);

  return (
    <div className={cn("flex flex-col gap-4", `level-block--${level}`)}>
      <div className="flex flex-col gap-2.5">
        <p className="type-subhead">Tick-borne disease ER visits per 10,000 ER visits · {range}</p>
        <Bar label={countyLabel(basis.county)} value={countyRate} max={max} strong />
        <Bar label="Massachusetts" value={stateRate} max={max} />
        <p className="type-footnote text-muted-foreground">
          {basis.dph.live ? `Checked ${formatRelative(basis.dph.checkedAt).toLowerCase()}.` : "From the last report we checked."} Not
          every case goes to an ER.
        </p>
      </div>

      <div className="flex flex-col gap-1 border-t border-separator pt-3.5">
        <p className="type-subhead">This week</p>
        {forecast ? (
          <p className="type-body">
            Highs {forecast.highMin === forecast.highMax ? `${forecast.highMax}°F` : `${forecast.highMin}–${forecast.highMax}°F`} ·{" "}
            {forecast.daysAboveFreezing === forecast.days ? "above freezing every day" : `${forecast.daysAboveFreezing} of ${forecast.days} days above freezing`}
          </p>
        ) : (
          <p className="type-body text-muted-foreground">No forecast right now, so this uses the DPH numbers only.</p>
        )}
        <p className="type-footnote text-muted-foreground">Ticks can be out whenever it&apos;s above freezing.</p>
      </div>

      <p className="border-t border-separator pt-3.5 type-footnote text-muted-foreground">
        How we set it: 1.5× Massachusetts or more is High, 0.75× or more is Moderate, a freezing week is Low. {townName} shares{" "}
        {countyLabel(basis.county)}&apos;s level.
      </p>
    </div>
  );
}

function Bar({ label, value, max, strong = false }: { label: string; value: number; max: number; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,8.5rem)_1fr_auto] items-center gap-3">
      <span className="truncate type-footnote text-muted-foreground">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-fill">
        {/* Grows from zero when it scrolls into view. */}
        <m.span
          className={cn("block h-full origin-left rounded-full", strong ? "bg-(--level-ink)" : "bg-label-tertiary")}
          style={{ width: `${Math.max(3, (value / max) * 100)}%` }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ ...smooth, duration: 0.8, delay: strong ? 0.1 : 0.25 }}
        />
      </span>
      <span className="type-subhead font-semibold tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}
