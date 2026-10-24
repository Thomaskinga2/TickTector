"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUp, Loader2, X } from "lucide-react";
import { toast } from "@/components/toaster";
import { TownSelect } from "@/components/town-select";
import { Button } from "@/components/ui/button";
import { createScanPost } from "@/lib/services/forum";
import type { TickdexCatch } from "@/lib/tickdex";
import { SCAN_SPECIES, SCAN_SPECIES_NAME, type ScanSpecies } from "@/lib/types";
import { useNearMe } from "@/lib/use-near-me";
import { useTickdex } from "@/lib/use-tickdex";

const STAGE = { larva: "Larva", nymph: "Nymph", adult: "Adult" };

// /forum?post=<Tickdex catch id>, from the scan screen's "Post tick" button: the scanned tick and one line for how
// you feel about it. Enter posts it with createScanPost. Render inside <Suspense> (it reads the URL).
export function ScanPostComposer({ onPosted }: { onPosted: () => void }) {
  const postId = useSearchParams().get("post");
  const entry = useTickdex().find((c) => c.id === postId);
  // A sample scan (no camera) has no photo, and a scan post needs one.
  if (!entry?.photo) return null;
  return <Composer key={entry.id} entry={entry} photo={entry.photo} onPosted={onPosted} />;
}

// Drops ?post= so a reload doesn't offer the same scan again.
function close() {
  const url = new URL(window.location.href);
  url.searchParams.delete("post");
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

function Composer({ entry, photo, onPosted }: { entry: TickdexCatch; photo: string; onPosted: () => void }) {
  // The town around the phone (or its IP address), until the person picks another. Coordinates stay on the phone.
  const { near } = useNearMe(true);
  const [picked, setPicked] = useState<string>();
  const townId = picked ?? near?.town.id ?? "";
  const [feeling, setFeeling] = useState("");
  const [sending, setSending] = useState(false);
  const species: ScanSpecies = (SCAN_SPECIES as readonly string[]).includes(entry.speciesId) ? (entry.speciesId as ScanSpecies) : "unknown";

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!townId) return toast("Choose your town first");
    setSending(true);
    try {
      await createScanPost({ photo, species, stage: entry.stage, location: { town: townId }, scannedAt: entry.caughtAt, caption: feeling.trim() || undefined });
      toast("Posted to Sightings");
      close();
      onPosted();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={post} aria-label="Post your scan" className="soft-block fade-in flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- the scan's own thumbnail (data: URL) */}
        <img src={photo} alt="Your scanned tick" className="size-14 shrink-0 rounded-xl bg-fill object-cover" />
        <div className="min-w-0 flex-1">
          <p className="type-headline">{SCAN_SPECIES_NAME[species]}</p>
          <p className="type-footnote text-muted-foreground">{STAGE[entry.stage]} · from your scan</p>
        </div>
        <button type="button" onClick={close} aria-label="Don't post this scan" className="pressable grid size-9 shrink-0 place-items-center rounded-full bg-fill">
          <X className="size-[18px]" strokeWidth={2.4} aria-hidden />
        </button>
      </div>
      <TownSelect id="scan-post-town" appearance="menu" value={townId} onChange={(id) => setPicked(id)} />
      <div className="flex items-center gap-2 rounded-full bg-fill py-1 pr-1 pl-4">
        <input
          aria-label="Type your feeling"
          placeholder="Type your feeling"
          enterKeyHint="send"
          maxLength={500}
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
          className="h-9 min-w-0 flex-1 bg-transparent type-body outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="icon-sm" disabled={sending} aria-label="Post to Sightings">
          {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowUp className="size-5" strokeWidth={2.6} aria-hidden />}
        </Button>
      </div>
    </form>
  );
}
