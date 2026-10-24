"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ScanLine } from "lucide-react";
import { EmptyState } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { TickdexCard, type CardRegistration } from "@/components/tickdex-card";
import { TickdexDemoTools } from "@/components/tickdex-demo-tools";
import { TickdexSheet } from "@/components/tickdex-sheet";
import { DEX_SIZE, DEX_SPECIES, TICK_STAGES, type TickdexCatch } from "@/lib/tickdex";
import { buildDex, findSlot, firstCaught, slotKey, type Dex, type DexSlot } from "@/lib/tickdex-slots";
import { useTickdex } from "@/lib/use-tickdex";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};

// False in the prerendered HTML and during hydration, true after: the catches only exist in this browser.
function useIsMounted(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

// The catch to celebrate: the one Scan linked to (?new=<id>), or the newest one recorded while the page is open.
function registrationFor(catches: TickdexCatch[], dex: Dex, newId: string | null, openedAt: number) {
  const entry = catches.find((c) => c.id === newId || Date.parse(c.caughtAt) > openedAt);
  if (!entry) return null;
  const slot = findSlot(dex, slotKey(entry.speciesId, entry.stage));
  if (!slot) return null;
  const registration: CardRegistration = { kind: firstCaught(slot)?.id === entry.id ? "new" : "repeat", entryId: entry.id };
  return { key: slot.key, registration };
}

export function Tickdex() {
  const searchParams = useSearchParams();
  const newParam = searchParams.get("new");
  const isDemo = searchParams.get("demo") === "1";
  // Keep the last ?new= after it is dropped from the URL below. The route can stay mounted while hidden
  // (Cache Components), so this follows each new value rather than reading the URL once.
  const [newId, setNewId] = useState(newParam);
  if (newParam && newParam !== newId) setNewId(newParam);
  const [openedAt] = useState(() => Date.now());
  const catches = useTickdex();
  const isMounted = useIsMounted();
  const dex = useMemo(() => buildDex(catches), [catches]);
  const target = useMemo(() => registrationFor(catches, dex, newId, openedAt), [catches, dex, newId, openedAt]);
  // The key stays set while the sheet animates closed, so its content does not vanish mid-slide.
  const [sheet, setSheet] = useState<{ key: string; open: boolean } | null>(null);
  const openSheet = useCallback((key: string) => setSheet({ key, open: true }), []);

  // Drop ?new= so a reload does not replay the moment.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("new")) return;
    url.searchParams.delete("new");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [newParam]);

  if (!isMounted) return <TickdexSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <TickdexHeader caught={dex.caughtSlots} totalCatches={dex.totalCatches} />
      {dex.totalCatches === 0 && (
        <EmptyState
          action={
            <Link href="/scan" className={buttonVariants()}>
              <ScanLine aria-hidden />
              Catch your first tick
            </Link>
          }
        >
          Nothing caught yet. Every tick you scan lands here, with {DEX_SIZE} stages to fill. Tap any card to read up on that tick.
        </EmptyState>
      )}
      {dex.rows.map((row) => (
        <DexRowView
          key={row.speciesId}
          title={row.name}
          slots={row.slots}
          target={target}
          onOpen={openSheet}
          count={`${row.slots.filter((s) => s.catches.length > 0).length} of ${row.slots.length}`}
        />
      ))}
      {dex.unidentified.length > 0 && (
        <DexRowView
          title="Unidentified"
          note="Ticks the scan could not name. They don’t fill a stage."
          slots={dex.unidentified}
          target={target}
          onOpen={openSheet}
        />
      )}
      {isDemo && <TickdexDemoTools catchCount={dex.totalCatches} />}
      <TickdexSheet
        slot={sheet ? findSlot(dex, sheet.key) : undefined}
        open={sheet?.open ?? false}
        onOpenChange={(open) => setSheet((s) => (s ? { ...s, open } : null))}
      />
    </div>
  );
}

// The collection's progress: stages caught out of nine, as a bar in the tint.
function TickdexHeader({ caught, totalCatches }: { caught: number; totalCatches: number }) {
  const percent = Math.round((caught / DEX_SIZE) * 100);
  const complete = caught === DEX_SIZE;
  return (
    <section aria-labelledby="tickdex-title" className="soft-block flex flex-col gap-3 px-4 pt-3.5 pb-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="tickdex-title" className="type-title3 font-semibold">
          Tickdex
        </h2>
        {complete && (
          <span className="rounded-full bg-[color-mix(in_oklab,var(--tint)_15%,transparent)] px-2.5 py-1 type-caption1 font-semibold text-primary">
            Complete
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="type-title1 font-bold tabular-nums">
          {caught}
          <span className="type-headline font-semibold text-muted-foreground"> of {DEX_SIZE} stages</span>
        </p>
        <p className="type-footnote text-muted-foreground tabular-nums">
          {totalCatches} {totalCatches === 1 ? "catch" : "catches"} in all
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Tickdex progress"
        aria-valuemin={0}
        aria-valuemax={DEX_SIZE}
        aria-valuenow={caught}
        aria-valuetext={`${caught} of ${DEX_SIZE} stages caught, ${percent}%`}
        className="h-2 overflow-hidden rounded-full bg-fill"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out-smooth"
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  );
}

type Target = { key: string; registration: CardRegistration } | null;

function DexRowView({
  title,
  note,
  count,
  slots,
  target,
  onOpen,
}: {
  title: string;
  note?: string;
  count?: string;
  slots: DexSlot[];
  target: Target;
  onOpen: (key: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="type-title3 font-semibold">{title}</h2>
        {count && <span className="shrink-0 type-subhead text-muted-foreground tabular-nums">{count}</span>}
      </div>
      {note && <p className="-mt-1 px-1 type-footnote text-muted-foreground">{note}</p>}
      <div className="grid grid-cols-3 gap-2.5">
        {slots.map((slot) => (
          <TickdexCard
            key={slot.key}
            slot={slot}
            onOpen={onOpen}
            registration={target?.key === slot.key ? target.registration : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export function TickdexSkeleton() {
  return (
    <div role="status" aria-label="Loading your Tickdex" className="flex flex-col gap-6">
      <div className="h-[124px] animate-pulse rounded-[22px] bg-fill" />
      {/* One row per species and one card per stage, so the page doesn't jump when the real grid mounts. */}
      {DEX_SPECIES.map((species) => (
        <div key={species.id} className="flex flex-col gap-2">
          <div className="mx-1 h-[25px] w-40 animate-pulse rounded-md bg-fill" />
          <div className="grid grid-cols-3 gap-2.5">
            {TICK_STAGES.map((stage) => (
              <div key={stage} className={cn("h-[168px] animate-pulse rounded-[18px] bg-fill")} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
