"use client";

import { Drawer } from "@base-ui/react/drawer";
import { BookOpen } from "lucide-react";
import { TickAftercare } from "@/components/tick-aftercare";
import { TickPhoto, TickPhotoCredit } from "@/components/tick-photo";
import { DemoBadge } from "@/components/tickdex-card";
import { SourcesFooter, SourcesProvider, useCite } from "@/components/sources";
import { Disclaimer } from "@/components/states";
import { SPECIES } from "@/lib/mock-data";
import { UNKNOWN_SPECIES_ID, formatDexNumber, formatLongDate, newestPhoto, stageLabel, type DexSlot } from "@/lib/tickdex-slots";

type TickdexSheetProps = {
  slot: DexSlot | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// The detail sheet for one slot (HIG Sheets: grabber, Done, large detent). Closes by swipe down, tap outside,
// Esc or Done.
export function TickdexSheet({ slot, open, onOpenChange }: TickdexSheetProps) {
  return (
    <Drawer.Root open={open && slot !== undefined} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-[60] min-h-dvh bg-black opacity-[calc(0.45*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[400ms] ease-out-smooth data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0" />
        <Drawer.Viewport className="fixed inset-0 z-[70] flex items-end justify-center">
          <Drawer.Popup
            className={[
              "sheet relative max-h-[calc(100dvh-env(safe-area-inset-top)-0.75rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[26px] bg-background text-foreground outline-none touch-auto",
              "[transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[400ms] ease-out-smooth",
              "data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)] data-swiping:select-none",
              "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*350ms)] motion-reduce:duration-0",
            ].join(" ")}
          >
            {slot && (
              <SourcesProvider>
                <SheetBody slot={slot} />
              </SourcesProvider>
            )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SheetBody({ slot }: { slot: DexSlot }) {
  const photo = newestPhoto(slot);
  const newest = slot.catches[0];
  const count = slot.catches.length;

  return (
    <Drawer.Content className="flex flex-col gap-5 px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto h-[5px] w-9 shrink-0 rounded-full bg-label-tertiary" aria-hidden />
      <div className="-mt-3 flex justify-end">
        <Drawer.Close className="pressable min-h-11 rounded-full px-1 type-body font-semibold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Done
        </Drawer.Close>
      </div>

      <div className="-mt-4 flex flex-col gap-1.5">
        <div className="relative h-[220px] overflow-hidden rounded-[22px] bg-fill">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from localStorage, nothing to optimize
            <img src={photo} alt={`Your photo of a ${slot.speciesName.toLowerCase()} ${slot.stage}`} width={343} height={220} className="h-full w-full object-cover" />
          ) : (
            <TickPhoto speciesId={slot.speciesId} stage={slot.stage} engorgement={newest?.engorgement} width={343} height={220} />
          )}
          <span className="glass absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 type-footnote font-semibold tabular-nums">
            {formatDexNumber(slot.number)}
          </span>
        </div>
        {!photo && <TickPhotoCredit speciesId={slot.speciesId} stage={slot.stage} className="px-1" />}
      </div>

      <div className="flex flex-col gap-0.5 px-1">
        <Drawer.Title className="type-title2 font-semibold">{slot.speciesName}</Drawer.Title>
        <Drawer.Description className="type-subhead text-muted-foreground">
          {stageLabel(slot.stage)} · {count > 0 ? `caught ${count} ${count === 1 ? "time" : "times"}` : "not caught yet"}
        </Drawer.Description>
      </div>

      {slot.speciesId === UNKNOWN_SPECIES_ID ? (
        <p className="soft-block p-4 type-subhead">The scan could not name this tick. Compare it with the Tickdex, or ask on Sightings.</p>
      ) : (
        <SpeciesFacts speciesId={slot.speciesId} />
      )}

      <TickAftercare speciesId={slot.speciesId} latest={newest} />

      {count > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="px-1 type-title3 font-semibold">Your catches</h3>
          <ol className="soft-block flex flex-col divide-y divide-separator overflow-hidden">
            {slot.catches.map((c) => (
              <li key={c.id} className="flex min-h-14 items-center gap-3 px-4 py-2.5">
                <span className="size-11 shrink-0 overflow-hidden rounded-[10px] bg-fill">
                  {c.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- data URL from localStorage, nothing to optimize
                    <img src={c.photo} alt="" width={44} height={44} className="h-full w-full object-cover" />
                  ) : (
                    <TickPhoto speciesId={c.speciesId} stage={c.stage} engorgement={c.engorgement} width={44} height={44} />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="type-subhead font-semibold">{formatLongDate(c.caughtAt)}</span>
                  <span className="type-footnote text-muted-foreground first-letter:uppercase">{c.engorgement}</span>
                </span>
                {c.isBeanDemo && <DemoBadge />}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-col gap-2">
        <Disclaimer levels={false} />
        <SourcesFooter />
      </div>
    </Drawer.Content>
  );
}

// Field notes from the same cited species list the town pages use (Mass. DPH and CDC). Disease risk stays plain
// text, never the level colors (those mean a town's risk this week).
function SpeciesFacts({ speciesId }: { speciesId: string }) {
  const species = SPECIES.find((s) => s.id === speciesId);
  useCite(species?.sources);
  if (!species) return null;

  return (
    <section aria-labelledby="field-notes-title" className="soft-block flex flex-col gap-3 px-4 pt-3.5 pb-4">
      <h3 id="field-notes-title" className="flex items-center gap-2.5 type-headline">
        <span className="module-icon">
          <BookOpen className="size-[18px]" strokeWidth={2.2} aria-hidden />
        </span>
        Field notes
      </h3>
      <p className="type-subhead text-muted-foreground italic">{species.scientificName}</p>
      <Fact label="Season">{species.season}</Fact>
      <Fact label="Can carry">
        <span className="mt-1 flex flex-wrap gap-1.5">
          {species.diseases.map((d) => (
            <span key={d} className="rounded-full bg-fill px-2.5 py-1 type-footnote">
              {d}
            </span>
          ))}
        </span>
      </Fact>
      {species.note && <p className="type-subhead">{species.note}</p>}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="type-footnote font-semibold text-muted-foreground">{label}</span>
      <span className="type-subhead">{children}</span>
    </div>
  );
}
