import { ShieldCheck } from "lucide-react";
import { slotStatus, type SlotProps } from "@/components/states";
import type { ActionAlert } from "@/lib/types";

export function ActionAlerts({ alerts, ...slot }: { alerts?: ActionAlert[] } & SlotProps) {
  const status = slotStatus(slot, !alerts?.length, "No prevention steps for this risk level yet.");
  if (status || !alerts) return status;

  return (
    <div className="flex flex-col gap-4">
      {alerts.map((alert) => (
        <div key={alert.id} className="rounded-lg bg-primary p-4 text-primary-foreground">
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
