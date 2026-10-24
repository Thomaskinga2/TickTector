"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ScanLine } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TickdexCard, type CardRegistration } from "@/components/tickdex-card";
import { TickdexDemoTools } from "@/components/tickdex-demo-tools";
import { TickdexSheet } from "@/components/tickdex-sheet";
import { DEX_SIZE, type TickdexCatch } from "@/lib/tickdex";
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
  // Read once: ?new= is removed from the URL below, but this visit should still celebrate it.
  const [visit] = useState(() => ({
    newId: searchParams.get("new"),
    isDemo: searchParams.get("demo") === "1",
    openedAt: Date.now(),
  }));
  const catches = useTickdex();
  const isMounted = useIsMounted();
  const dex = useMemo(() => buildDex(catches), [catches]);
  const target = useMemo(() => registrationFor(catches, dex, visit.newId, visit.openedAt), [catches, dex, visit]);
  // The key stays set while the sheet animates closed, so its content does not vanish mid-slide.
  const [sheet, setSheet] = useState<{ key: string; open: boolean } | null>(null);
  const openSheet = useCallback((key: string) => setSheet({ key, open: true }), []);

  // Drop ?new= so a reload does not replay the moment.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("new")) return;
    url.searchParams.delete("new");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  if (!isMounted) return <TickdexSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <TickdexHeader caught={dex.caughtSlots} totalCatches={dex.totalCatches} />
      {dex.totalCatches === 0 && <EmptyTickdex />}
      {dex.rows.map((row) => (
        <DexRowView
          key={row.speciesId}
          title={row.name}
          slots={row.slots}
          target={target}
          onOpen={openSheet}
          chip={`${row.slots.filter((s) => s.catches.length > 0).length}/${row.slots.length}`}
        />
      ))}
      {dex.unidentified.length > 0 && (
        <DexRowView
          title="Unidentified"
          note="Ticks the scan could not name. They don’t fill a dex slot."
          slots={dex.unidentified}
          target={target}
          onOpen={openSheet}
        />
      )}
      {visit.isDemo && <TickdexDemoTools catchCount={dex.totalCatches} />}
      <TickdexSheet
        slot={sheet ? findSlot(dex, sheet.key) : undefined}
        open={sheet?.open ?? false}
        onOpenChange={(open) => setSheet((s) => (s ? { ...s, open } : null))}
      />
    </div>
  );
}

function TickdexHeader({ caught, totalCatches }: { caught: number; totalCatches: number }) {
  const percent = Math.round((caught / DEX_SIZE) * 100);
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-3xl bg-primary px-5 pt-5 pb-5 text-primary-foreground shadow-[0_4px_0_var(--tickdex-shadow)]",
        caught === DEX_SIZE && "ring-2 ring-tickdex-gold shadow-[0_4px_0_var(--tickdex-shadow),0_0_28px_-4px_var(--tickdex-gold)]",
      )}
    >
      <p className="text-[12px] font-semibold tracking-[0.18em] text-primary-foreground/80 uppercase">Field collection</p>
      <h1 className="mt-1 font-tickdex text-[34px] leading-none">Tickdex</h1>
      {caught === DEX_SIZE && (
        <p className="absolute top-5 right-5 rotate-6 rounded-xl border-2 border-tickdex-gold px-2.5 py-1 font-tickdex text-[16px] leading-none text-tickdex-gold">
          Complete!
        </p>
      )}
      <div className="mt-4 flex items-baseline justify-between">
        <p className="font-tickdex text-[20px] leading-none">
          {caught} / {DEX_SIZE} <span className="text-[16px] text-primary-foreground/80">caught</span>
        </p>
        <p className="text-[13px] text-primary-foreground/85">
          {totalCatches} {totalCatches === 1 ? "catch" : "catches"} in all
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Tickdex progress"
        aria-valuemin={0}
        aria-valuemax={DEX_SIZE}
        aria-valuenow={caught}
        aria-valuetext={`${caught} of ${DEX_SIZE} caught, ${percent}%`}
        className="mt-2.5 h-3 overflow-hidden rounded-full bg-primary-foreground/15"
      >
        <div
          className="h-full rounded-full bg-tickdex-gold shadow-[inset_0_-2px_0_rgb(0_0_0/0.15)] transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </header>
  );
}

function EmptyTickdex() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-4">
      <p className="text-[15px]">
        <span className="font-semibold">Nothing caught yet.</span> Every tick you scan lands here, nine slots to fill.
      </p>
      <Link href="/scan" className={cn(buttonVariants({ size: "lg" }), "h-11 bg-tickdex-gold px-4 text-[15px] font-semibold text-tickdex-ink shadow-[0_3px_0_var(--tickdex-ink)] hover:bg-tickdex-gold/90")}>
        <ScanLine aria-hidden />
        Catch your first tick
      </Link>
    </div>
  );
}

type Target = { key: string; registration: CardRegistration } | null;

function DexRowView({
  title,
  note,
  chip,
  slots,
  target,
  onOpen,
}: {
  title: string;
  note?: string;
  chip?: string;
  slots: DexSlot[];
  target: Target;
  onOpen: (key: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-tickdex text-[17px] leading-tight">{title}</h2>
        {chip && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">{chip}</span>}
      </div>
      {note && <p className="-mt-1 text-[12px] text-muted-foreground">{note}</p>}
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
      <div className="h-[132px] animate-pulse rounded-3xl bg-muted" />
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex flex-col gap-2">
          <div className="h-[22px] w-40 animate-pulse rounded-md bg-muted" />
          <div className="grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((card) => (
              <div key={card} className="h-[160px] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
