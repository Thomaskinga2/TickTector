"use client";

import { useLayoutEffect, useRef } from "react";
import { TickArt } from "@/components/tick-art";
import { TickPhoto } from "@/components/tick-photo";
import { playRegistration, type RegistrationKind } from "@/components/tickdex-registration";
import { cn } from "@/lib/utils";
import { firstCaught, formatDexNumber, formatShortDate, newestPhoto, stageLabel, type DexSlot } from "@/lib/tickdex-slots";

export type CardRegistration = { kind: RegistrationKind; entryId: string };

type TickdexCardProps = {
  slot: DexSlot;
  registration?: CardRegistration;
  onOpen: (key: string) => void;
};

// The card surface: a small soft block (the app's card, a slightly tighter corner for the 3-up grid).
const CARD = "rounded-[18px] bg-card shadow-[0_1px_2px_rgb(92_72_42/0.06),0_8px_20px_-12px_rgb(92_72_42/0.22)]";

// One dex slot: caught (photo or drawn tick, stage, count, first catch) or not caught yet (reference photo, still opens
// the sheet so anyone can read up on that tick). The silhouette face is only the back of the "new catch" flip.
export function TickdexCard({ slot, registration, onOpen }: TickdexCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLButtonElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const kind = registration?.kind;
  const entryId = registration?.entryId;

  // Layout effect: the flip's first frame (silhouette side up) must be applied before the browser paints.
  useLayoutEffect(() => {
    if (!kind || !entryId || !rootRef.current || !innerRef.current || !faceRef.current) return;
    return playRegistration(kind, entryId, { root: rootRef.current, inner: innerRef.current, face: faceRef.current, badge: badgeRef.current });
  }, [kind, entryId]);

  if (slot.catches.length === 0) {
    return (
      <div data-slot-key={slot.key} className="relative h-[168px] scroll-my-24">
        <CaughtFace ref={faceRef} slot={slot} isNew={false} onOpen={onOpen} />
      </div>
    );
  }

  return (
    <div ref={rootRef} data-slot-key={slot.key} className="relative h-[168px] scroll-my-24 [perspective:700px]">
      <div ref={innerRef} className="relative h-full [transform-style:preserve-3d]">
        <CaughtFace ref={faceRef} slot={slot} isNew={kind === "new"} onOpen={onOpen} />
        {kind === "new" && <EmptyFace slot={slot} className="absolute inset-0 backface-hidden [transform:rotateY(180deg)]" />}
      </div>
      {kind && (
        <span
          ref={badgeRef}
          className="pointer-events-none absolute -top-2 -right-1.5 z-10 rotate-[-8deg] rounded-full bg-primary px-2 py-0.5 type-caption1 font-bold text-primary-foreground shadow-[0_2px_6px_rgb(0_0_0/0.18)]"
        >
          {kind === "new" ? "New" : "+1"}
        </span>
      )}
    </div>
  );
}

function CaughtFace({
  ref,
  slot,
  isNew,
  onOpen,
}: {
  ref: React.Ref<HTMLButtonElement>;
  slot: DexSlot;
  isNew: boolean;
  onOpen: (key: string) => void;
}) {
  const photo = newestPhoto(slot);
  const newest = slot.catches[0];
  const first = firstCaught(slot);
  const count = slot.catches.length;
  const isCaught = count > 0;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpen(slot.key)}
      aria-label={`${formatDexNumber(slot.number)}, ${slot.speciesName}, ${stageLabel(slot.stage)}, ${isCaught ? `caught ${count} ${count === 1 ? "time" : "times"}` : "not caught yet"}`}
      className={cn(
        CARD,
        "pressable absolute inset-0 flex flex-col p-1.5 text-left backface-hidden outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        // Caught slots carry a hairline ring in the tint; the rest stay plain cards.
        isCaught && slot.number > 0 && "ring-2 ring-primary/70",
        isNew && "ring-primary",
      )}
    >
      <span className="relative block h-[96px] w-full shrink-0 overflow-hidden rounded-[13px] bg-fill">
        <span className={cn("block h-full w-full", !isCaught && "opacity-60 grayscale-[45%]")}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from localStorage, nothing to optimize
            <img src={photo} alt="" width={104} height={96} className="h-full w-full object-cover" />
          ) : (
            <TickPhoto speciesId={slot.speciesId} stage={slot.stage} engorgement={newest?.engorgement} width={104} height={96} />
          )}
        </span>
        {count > 1 && (
          <span className="absolute top-1 left-1 rounded-full bg-card/90 px-1.5 py-px type-caption2 font-bold text-foreground tabular-nums">
            ×{count}
          </span>
        )}
        <span className="absolute top-1 right-1 rounded-full bg-card/90 px-1.5 py-px type-caption2 font-semibold whitespace-nowrap text-muted-foreground tabular-nums">
          {formatDexNumber(slot.number)}
        </span>
        {newest?.isBeanDemo && <DemoBadge className="absolute right-1 bottom-1" />}
      </span>
      <span className="mt-1.5 truncate px-1 type-subhead font-semibold">{stageLabel(slot.stage)}</span>
      <span className={cn("px-1 type-caption1", isCaught ? "text-muted-foreground" : "text-label-tertiary")}>
        {first ? `First ${formatShortDate(first.caughtAt)}` : "Not caught yet"}
      </span>
    </button>
  );
}

// The back of the flip: the tick as a silhouette, before the catch turns it over.
function EmptyFace({ slot, className }: { slot: DexSlot; className?: string }) {
  return (
    <div aria-label={`${formatDexNumber(slot.number)}, not caught yet`} role="img" className={cn(CARD, "flex h-[168px] flex-col p-1.5", className)}>
      <span className="block h-[96px] w-full shrink-0 overflow-hidden rounded-[13px] bg-fill">
        <TickArt speciesId={slot.speciesId} stage={slot.stage} silhouette="var(--label-tertiary)" className="h-full w-full" />
      </span>
      <span className="mt-1.5 px-1 type-subhead font-semibold text-label-tertiary">???</span>
    </div>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn("rounded-full bg-foreground/75 px-1.5 py-px type-caption2 font-semibold text-card", className)}>Demo</span>
  );
}
