"use client";

import { useLayoutEffect, useRef } from "react";
import { TickArt } from "@/components/tick-art";
import { playRegistration, type RegistrationKind } from "@/components/tickdex-registration";
import { cn } from "@/lib/utils";
import { firstCaught, formatDexNumber, formatShortDate, newestPhoto, stageLabel, type DexSlot } from "@/lib/tickdex-slots";

export type CardRegistration = { kind: RegistrationKind; entryId: string };

type TickdexCardProps = {
  slot: DexSlot;
  registration?: CardRegistration;
  onOpen: (key: string) => void;
};

// One dex slot: caught (photo or drawn tick, stage, count, first catch) or an empty silhouette.
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
    return playRegistration(kind, { root: rootRef.current, inner: innerRef.current, face: faceRef.current, badge: badgeRef.current });
  }, [kind, entryId]);

  if (slot.catches.length === 0) return <EmptyFace slot={slot} />;

  return (
    <div ref={rootRef} data-slot-key={slot.key} className="relative h-[160px] scroll-my-24 [perspective:700px]">
      <div ref={innerRef} className="relative h-full [transform-style:preserve-3d]">
        <CaughtFace ref={faceRef} slot={slot} isNew={kind === "new"} onOpen={onOpen} />
        {kind === "new" && <EmptyFace slot={slot} className="absolute inset-0 backface-hidden [transform:rotateY(180deg)]" />}
      </div>
      {kind && (
        <span
          ref={badgeRef}
          className="pointer-events-none absolute -top-3 -right-2 z-10 rotate-[-8deg] rounded-full border-2 border-tickdex-ink bg-tickdex-gold px-2 py-0.5 font-tickdex text-[13px] leading-none text-tickdex-ink shadow-[0_2px_0_var(--tickdex-ink)]"
        >
          {kind === "new" ? "NEW!" : "+1"}
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

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpen(slot.key)}
      aria-label={`${formatDexNumber(slot.number)}, ${slot.speciesName}, ${stageLabel(slot.stage)}, caught ${count} ${count === 1 ? "time" : "times"}`}
      className={cn(
        "absolute inset-0 flex flex-col rounded-2xl border-2 bg-tickdex-card p-1.5 text-left text-tickdex-ink backface-hidden",
        slot.number > 0 ? "border-tickdex-gold" : "border-tickdex-edge",
        "bg-[linear-gradient(180deg,var(--tickdex-paper),var(--tickdex-card))] shadow-[0_3px_0_var(--tickdex-edge)] transition-transform active:scale-[0.97]",
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
        isNew && "shadow-[0_0_0_2px_var(--tickdex-gold),0_6px_16px_-8px_var(--tickdex-gold)]",
      )}
    >
      <span className="flex h-4 items-center justify-between px-0.5">
        <span className="font-tickdex text-[12px] leading-none">{formatDexNumber(slot.number)}</span>
        {count > 1 && <span className="flex h-4 items-center rounded-full bg-tickdex-ink px-1.5 font-tickdex text-[12px] leading-none text-tickdex-gold">×{count}</span>}
      </span>
      <span className="relative mt-1 block h-[90px] w-full shrink-0">
        <span className="block h-full w-full overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_40%,#fff,var(--tickdex-card))]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from localStorage, nothing to optimize
            <img src={photo} alt="" width={96} height={90} className="h-full w-full object-cover" />
          ) : (
            <TickArt speciesId={slot.speciesId} stage={slot.stage} engorgement={newest?.engorgement} className="h-full w-full" />
          )}
        </span>
        {newest?.isBeanDemo && <DemoBadge className="absolute top-0.5 right-0.5" />}
      </span>
      <span className="mt-auto px-0.5 text-[14px] leading-tight font-semibold">{stageLabel(slot.stage)}</span>
      <span className="px-0.5 text-[12px] leading-tight text-tickdex-ink/80">
        {first ? `First ${formatShortDate(first.caughtAt)}` : ""}
      </span>
    </button>
  );
}

function EmptyFace({ slot, className }: { slot: DexSlot; className?: string }) {
  return (
    <div
      aria-label={`${formatDexNumber(slot.number)}, not caught yet`}
      role="img"
      className={cn(
        "flex h-[160px] flex-col rounded-2xl border-2 border-white/5 bg-tickdex-night p-1.5 text-tickdex-paper",
        "shadow-[inset_0_2px_10px_rgb(0_0_0/0.35)]",
        className,
      )}
    >
      <span className="flex h-4 items-center px-0.5 font-tickdex text-[12px] leading-none text-tickdex-paper/80">
        {formatDexNumber(slot.number)}
      </span>
      <span className="mt-1 block h-[90px] w-full shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_50%,rgb(255_255_255/0.16),rgb(255_255_255/0.04)_45%,transparent_72%)]">
        <TickArt speciesId={slot.speciesId} stage={slot.stage} silhouette="var(--tickdex-shadow)" className="h-full w-full" />
      </span>
      <span className="mt-auto px-0.5 pb-1 font-tickdex text-[20px] leading-none tracking-widest text-tickdex-paper/80">???</span>
    </div>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn("rounded-full bg-tickdex-ink/85 px-1.5 py-0.5 text-[11px] leading-none font-bold text-tickdex-paper", className)}>
      Demo: bean
    </span>
  );
}
