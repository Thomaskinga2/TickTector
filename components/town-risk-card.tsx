"use client";

import Link from "next/link";
import * as m from "motion/react-m";
import { X } from "lucide-react";
import { formatWeekRange } from "@/components/format";
import { townName } from "@/components/map-utils";
import { RiskBadge } from "@/components/risk-badge";
import { slotStatus } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { getWeeklyRisk } from "@/lib/services/risk";
import { useAsync } from "@/lib/use-async";
import { springy } from "@/lib/motion";
import { cn } from "@/lib/utils";

// The selected town on the risk map: level, this week's reason, and the way to its full page.
export function TownRiskCard({ townId, onClose }: { townId: string; onClose: () => void }) {
  const { data: risk, ...slot } = useAsync(() => getWeeklyRisk(townId), [townId]);
  const name = townName(townId);

  return (
    <m.section
      // Springs up from the map when a town is picked. Closing folds its slot shut (app/map/page.tsx).
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springy}
      aria-label={`${name} this week`}
      aria-live="polite"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className="flex flex-col gap-2 rounded-xl bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="type-title3 font-semibold">{name}</h2>
          {risk && (
            <p className="flex items-center gap-2 type-subhead text-muted-foreground">
              <RiskBadge level={risk.level} className="text-foreground" />· Week of {formatWeekRange(risk.weekOf)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${name}`}
          className="pressable -mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full bg-fill text-muted-foreground"
        >
          <X className="size-4" strokeWidth={2.6} aria-hidden />
        </button>
      </div>

      {slotStatus(slot, !risk, "No risk data for this town yet.") ?? <p className="type-body">{risk?.reason}</p>}

      <Link href={`/area/${townId}`} className={cn(buttonVariants(), "mt-1 w-full")}>
        See what to do this week
      </Link>
    </m.section>
  );
}
