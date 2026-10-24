import { RiskBadge } from "@/components/risk-badge";
import { slotStatus, type SlotProps } from "@/components/states";
import type { TickSpecies } from "@/lib/types";

export function TickSpeciesList({ species, ...slot }: { species?: TickSpecies[] } & SlotProps) {
  const status = slotStatus(slot, !species?.length, "No tick species recorded here yet.");
  if (status || !species) return status;

  return (
    <ul className="flex flex-col divide-y rounded-lg border bg-card">
      {species.map((s) => (
        <li key={s.id} className="flex flex-col gap-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">{s.commonName}</p>
            <RiskBadge level={s.danger} className="shrink-0" />
          </div>
          <p className="text-sm italic text-muted-foreground">{s.scientificName}</p>
          <p className="text-sm">Can carry: {s.diseases.join(", ")}</p>
          <p className="text-sm text-muted-foreground">Active: {s.season}</p>
        </li>
      ))}
    </ul>
  );
}
