import { RISK_BG, RISK_LABEL } from "@/components/risk-badge";
import { slotStatus, type SlotProps } from "@/components/states";
import { RISK_LEVELS, type WeeklyRisk } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RiskGauge({ risk, ...slot }: { risk?: WeeklyRisk } & SlotProps) {
  const status = slotStatus(slot, !risk, "No risk data for this town yet.");
  if (status || !risk) return status;

  const filled = RISK_LEVELS.indexOf(risk.level);
  return (
    <section aria-label="Tick risk this week" className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Tick risk, week of {formatWeek(risk.weekOf)}</p>
      <p className="text-5xl font-bold tracking-tight">{RISK_LABEL[risk.level]}</p>
      <div className="grid grid-cols-3 gap-1.5" aria-hidden>
        {RISK_LEVELS.map((level, i) => (
          <div key={level} className="flex flex-col gap-1">
            <div className={cn("h-3 rounded-full", i <= filled ? RISK_BG[risk.level] : "bg-muted")} />
            <span className="text-xs text-muted-foreground">{RISK_LABEL[level]}</span>
          </div>
        ))}
      </div>
      <p className="text-lg leading-snug">{risk.reason}</p>
    </section>
  );
}

function formatWeek(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
