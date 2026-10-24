"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useCite } from "@/components/sources";
import { slotStatus, type SlotProps } from "@/components/states";
import { TickSpeciesIcon } from "@/components/tick-species-icon";
import type { TickSpecies } from "@/lib/types";

// Ticks found in the town, with what they carry and when they're active. Tap one to see a real photo.
export function TickSpeciesList({ species, ...slot }: { species?: TickSpecies[] } & SlotProps) {
  const [open, setOpen] = useState<TickSpecies | null>(null);
  // Facts and photo credits both go to the page's sources line at the very bottom.
  useCite(species?.flatMap((s) => (s.photo ? [...s.sources, s.photo.credit] : s.sources)));
  const status = slotStatus(slot, !species?.length, "No tick species recorded here yet.");
  if (status || !species) return status;

  return (
    <>
      {/* Scannable: the name, what it spreads, when it's out. */}
      <ul className="flex flex-col divide-y divide-separator">
        {species.map((s) => (
          <li key={s.id} className="py-3 first:pt-0 last:pb-0">
            <button
              type="button"
              disabled={!s.photo}
              onClick={() => setOpen(s)}
              aria-label={s.photo ? `${s.commonName}: see a photo` : undefined}
              className="pressable flex w-full items-start gap-3 text-left"
            >
              <span className="relative shrink-0">
                <TickSpeciesIcon speciesId={s.id} className="size-11 rounded-md bg-fill p-1" />
                {s.photo && (
                  <Camera aria-hidden className="absolute -right-1 -bottom-1 size-[18px] rounded-full bg-card p-[3px] text-primary shadow-sm" strokeWidth={2.6} />
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="type-headline">
                  {s.commonName} <span className="type-footnote font-normal text-muted-foreground italic">{s.scientificName}</span>
                </span>
                <span className="type-subhead">Spreads: {s.diseases.join(", ")}</span>
                <span className="type-footnote text-muted-foreground">
                  Out: {s.season}
                  {s.note && <> · {s.note}</>}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <PhotoSheet species={open} onClose={() => setOpen(null)} />
    </>
  );
}

// A bottom sheet with the tick's photo (a native modal dialog: Esc, the backdrop and Done all close it).
function PhotoSheet({ species, onClose }: { species: TickSpecies | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (species && !ref.current?.open) ref.current?.showModal();
  }, [species]);

  return (
    <dialog
      ref={ref}
      aria-label={species ? `Photo of the ${species.commonName}` : undefined}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-xl bg-card p-0 pb-[env(safe-area-inset-bottom)] text-foreground backdrop:bg-black/45 open:animate-in open:fade-in open:slide-in-from-bottom-10 open:duration-300 sm:inset-auto sm:m-auto sm:max-w-md sm:rounded-xl sm:pb-0"
    >
      {species?.photo && (
        <>
          <div className="flex items-center justify-between gap-3 px-4 py-2">
            <div className="min-w-0">
              <p className="truncate type-headline">{species.commonName}</p>
              <p className="type-footnote text-muted-foreground italic">{species.scientificName}</p>
            </div>
            <button type="button" onClick={() => ref.current?.close()} className="pressable min-h-11 px-2 type-body font-semibold text-primary">
              Done
            </button>
          </div>
          <Image
            src={species.photo.src}
            width={species.photo.width}
            height={species.photo.height}
            alt={species.photo.alt}
            sizes="(min-width: 640px) 448px, 100vw"
            className="aspect-square w-full object-cover"
          />
        </>
      )}
    </dialog>
  );
}
