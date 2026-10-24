"use client";

import * as m from "motion/react-m";
import { Check } from "lucide-react";
import { useCite } from "@/components/sources";
import { slotStatus, type SlotProps } from "@/components/states";
import { springy } from "@/lib/motion";
import type { ActionAlert } from "@/lib/types";

// This week's prevention steps for the town's level.
export function ActionAlerts({ alerts, ...slot }: { alerts?: ActionAlert[] } & SlotProps) {
  useCite(alerts?.flatMap((a) => a.sources));
  const status = slotStatus(slot, !alerts?.length, "No prevention steps for this risk level yet.");
  if (status || !alerts) return status;

  return (
    // No alert titles: the module header and the big level above already say what they would.
    <div className="flex flex-col gap-4">
      {alerts.map((alert) => (
        <div key={alert.id}>
          <ul aria-label={alert.title} className="flex flex-col gap-2.5">
            {alert.steps.map((step, i) => (
              <li key={step} className="flex gap-3 type-body">
                {/* Each check pops in after the one before it, once the list is on screen. */}
                <m.span
                  className="mt-0.5 shrink-0"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ ...springy, delay: 0.25 + i * 0.12 }}
                >
                  <Check className="size-[18px] text-muted-foreground" strokeWidth={2.6} aria-hidden />
                </m.span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
