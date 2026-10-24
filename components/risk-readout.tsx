import { DeviceClock } from "@/components/device-clock";
import { formatWeekRange } from "@/components/format";
import { LevelFace } from "@/components/level-face";
import { Meadow } from "@/components/meadow";
import { RISK_LABEL } from "@/components/risk-badge";
import { ErrorState, LoadingState, type SlotProps } from "@/components/states";
import { WeatherNow } from "@/components/weather-now";
import type { WeeklyRisk } from "@/lib/types";
import { cn } from "@/lib/utils";

// The town page hero, read in one glance: town and time, the level's face and word, the risk week and why, all on
// the level's pastel with the meadow growing along the bottom.
export function RiskReadout({
  townId,
  townName,
  risk,
  loading,
  error,
  onRetry,
}: { townId: string; townName: string; risk?: WeeklyRisk } & SlotProps) {
  return (
    <section
      data-page-hero
      aria-label={`${townName} tick risk`}
      className={cn("town-hero soft-block overflow-hidden text-center", risk && `level-block--${risk.level}`)}
    >
      {/* The page's back and share buttons sit in the card's top corners (Page hero); the name starts below them. */}
      <div className="flex flex-col items-center px-5 pt-[58px]">
        <h1 className="type-title1 font-semibold">{townName}</h1>
        <p className="mt-0.5 type-subhead text-muted-foreground">
          <DeviceClock />
          <WeatherNow townId={townId} />
        </p>

        {risk ? (
          // Keyed by town so the settle animation replays when the town changes.
          <div key={risk.townId} className="readout-in mt-4 flex flex-col items-center gap-1.5">
            <LevelFace level={risk.level} size={92} className="face-bob" />
            <p className="mt-1">
              <span className="sr-only">Tick risk this week: </span>
              <span className="level-ink font-rounded text-[clamp(48px,14vw,60px)] leading-none font-bold tracking-tight">
                {RISK_LABEL[risk.level]}
              </span>
            </p>
            <p className="mt-1 type-headline">Tick risk · Week of {formatWeekRange(risk.weekOf)}</p>
            <p className="max-w-[32ch] type-callout text-muted-foreground">{risk.reason}</p>
          </div>
        ) : loading ? (
          <div className="mt-4 w-full">
            <LoadingState label="Checking this week's risk…" />
          </div>
        ) : (
          <div className="mt-4 w-full text-left">
            <ErrorState message={error ?? "No risk data for this town yet."} onRetry={error ? onRetry : undefined} />
          </div>
        )}
      </div>
      <Meadow level={risk?.level} className="mt-4" />
    </section>
  );
}
