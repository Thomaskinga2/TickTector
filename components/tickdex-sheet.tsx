"use client";

import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { TickArt } from "@/components/tick-art";
import { DemoBadge } from "@/components/tickdex-card";
import { tickdexDisplay } from "@/components/tickdex-font";
import { Disclaimer, LoadingState } from "@/components/states";
import { getSpecies } from "@/lib/services/risk";
import type { RiskLevel } from "@/lib/types";
import { useAsync } from "@/lib/use-async";
import { cn } from "@/lib/utils";
import { UNKNOWN_SPECIES_ID, formatDexNumber, formatLongDate, newestPhoto, stageLabel, type DexSlot } from "@/lib/tickdex-slots";

const DEFAULT_TOWN = "amherst";

const DANGER: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: "Low danger", className: "bg-risk-low/15 text-risk-low" },
  moderate: { label: "Moderate danger", className: "bg-risk-moderate/15 text-[color-mix(in_oklch,var(--risk-moderate),var(--foreground)_40%)]" },
  high: { label: "High danger", className: "bg-risk-high/15 text-risk-high" },
};

type TickdexSheetProps = {
  slot: DexSlot | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// The detail sheet for one caught slot. Closes by swipe down, tap outside, Esc or the close button.
export function TickdexSheet({ slot, open, onOpenChange }: TickdexSheetProps) {
  return (
    <Drawer.Root open={open && slot !== undefined} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 min-h-dvh bg-tickdex-shadow opacity-[calc(0.55*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
          <Drawer.Popup
            className={cn(
              tickdexDisplay.variable,
              "relative max-h-[88dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-3xl border-t-4 border-tickdex-gold bg-background text-foreground outline-none touch-auto",
              "[transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
              "data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)] data-swiping:select-none",
              "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*350ms)] motion-reduce:duration-0",
            )}
          >
            {slot && <SheetBody slot={slot} />}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SheetBody({ slot }: { slot: DexSlot }) {
  const photo = newestPhoto(slot);
  const newest = slot.catches[0];
  const townId = slot.catches.find((c) => c.townId)?.townId ?? DEFAULT_TOWN;
  const count = slot.catches.length;

  return (
    <Drawer.Content className="flex flex-col gap-5 px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-border" aria-hidden />
      <Drawer.Close
        aria-label="Close"
        className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <X className="size-5" aria-hidden />
      </Drawer.Close>

      <div className="relative h-[200px] overflow-hidden rounded-2xl border-2 border-tickdex-gold bg-[radial-gradient(circle_at_50%_40%,var(--tickdex-paper),var(--tickdex-card))]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL from localStorage, nothing to optimize
          <img src={photo} alt={`Your photo of a ${slot.speciesName.toLowerCase()} ${slot.stage}`} width={343} height={200} className="h-full w-full object-cover" />
        ) : (
          <TickArt speciesId={slot.speciesId} stage={slot.stage} engorgement={newest?.engorgement} className="h-full w-full p-3" />
        )}
        <span className="absolute top-2 left-2 rounded-full bg-tickdex-ink px-2.5 py-1 font-tickdex text-[14px] leading-none text-tickdex-gold">
          {formatDexNumber(slot.number)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <Drawer.Title className="font-tickdex text-[26px] leading-tight">{slot.speciesName}</Drawer.Title>
        <Drawer.Description className="text-[15px] text-muted-foreground">
          {stageLabel(slot.stage)} · caught {count} {count === 1 ? "time" : "times"}
        </Drawer.Description>
      </div>

      {slot.speciesId === UNKNOWN_SPECIES_ID ? (
        <p className="rounded-2xl bg-muted p-4 text-[15px]">
          The scan could not name this tick. Compare it with the dex above, or ask on the Forum.
        </p>
      ) : (
        <SpeciesFacts speciesId={slot.speciesId} townId={townId} />
      )}

      <section className="flex flex-col gap-2">
        <h3 className="font-tickdex text-[17px]">Your catches</h3>
        <ol className="flex flex-col divide-y rounded-2xl border bg-card">
          {slot.catches.map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-3">
              <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-tickdex-card">
                {c.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data URL from localStorage, nothing to optimize
                  <img src={c.photo} alt="" width={44} height={44} className="h-full w-full object-cover" />
                ) : (
                  <TickArt speciesId={c.speciesId} stage={c.stage} engorgement={c.engorgement} className="h-full w-full" />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[14px] font-semibold">{formatLongDate(c.caughtAt)}</span>
                <span className="text-[13px] text-muted-foreground first-letter:uppercase">{c.engorgement}</span>
              </span>
              {c.isBeanDemo && <DemoBadge />}
            </li>
          ))}
        </ol>
      </section>

      <Disclaimer />
    </Drawer.Content>
  );
}

function SpeciesFacts({ speciesId, townId }: { speciesId: string; townId: string }) {
  const { data, loading, error } = useAsync(() => getSpecies(townId), [townId]);
  const species = data?.find((s) => s.id === speciesId);

  if (loading) return <LoadingState label="Loading field notes…" />;
  if (error || !species) return <p className="text-[14px] text-muted-foreground">Field notes are unavailable right now.</p>;

  const danger = DANGER[species.danger];
  return (
    <section aria-label="Field notes" className="flex flex-col gap-3 rounded-2xl bg-muted/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] italic">{species.scientificName}</p>
        <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-bold", danger.className)}>{danger.label}</span>
      </div>
      <Fact label="Season">{species.season}</Fact>
      <Fact label="Can carry">
        <span className="mt-1 flex flex-wrap gap-1.5">
          {species.diseases.map((d) => (
            <span key={d} className="rounded-full border bg-background px-2.5 py-1 text-[13px]">
              {d}
            </span>
          ))}
        </span>
      </Fact>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-[15px]">{children}</span>
    </div>
  );
}
