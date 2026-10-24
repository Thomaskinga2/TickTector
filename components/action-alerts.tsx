import { ShieldCheck } from "lucide-react";
import { slotStatus, type SlotProps } from "@/components/states";
import type { ActionAlert } from "@/lib/types";

export function ActionAlerts({ alerts, ...slot }: { alerts?: ActionAlert[] } & SlotProps) {
  const status = slotStatus(slot, !alerts?.length, "No prevention steps for this risk level yet.");
  if (status || !alerts) return status;

  return (
    <div className="flex flex-col gap-4">
      {/* The first alert is this week's main advice; the rest (e.g. tick removal) are quieter. */}
      {alerts.map((alert, i) => (
        <div key={alert.id} className={i === 0 ? "rounded-lg bg-primary p-4 text-primary-foreground" : "rounded-lg border bg-card p-4"}>
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5" aria-hidden />
            {alert.title}
          </p>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
            {alert.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
