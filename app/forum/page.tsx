"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus, ScanLine } from "lucide-react";
import { ForumNotice, ForumPostList } from "@/components/forum-post-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/states";
import { Page } from "@/components/page";
import { toast } from "@/components/toaster";
import { TownSelect } from "@/components/town-select";
import { SAMPLE_SCAN } from "@/lib/fixtures/sample-scan";
import { createScanPost, getPosts } from "@/lib/services/forum";
import { useAsync } from "@/lib/use-async";

export default function ForumPage() {
  const [townId, setTownId] = useState("");
  const { data: posts, ...slot } = useAsync(() => getPosts(townId || undefined), [townId]);

  return (
    <Page
      title="Sightings"
      className="gap-4"
      trailing={
        // HIG: one prominent, tinted primary action on the trailing side of the bar.
        <Link
          href="/forum/new"
          aria-label="Report a sighting"
          className="pressable grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_rgb(0_0_0/0.4)]"
        >
          <Plus className="size-6" strokeWidth={2.4} aria-hidden />
        </Link>
      }
    >
      <p className="-mt-3 px-0.5 type-subhead text-muted-foreground">Ticks your neighbors found or scanned, town by town.</p>
      <ForumNotice />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between px-1 type-footnote text-muted-foreground">
          <label htmlFor="forum-town">Showing</label>
          {!!posts?.length && (
            <span aria-live="polite">
              {posts.length} {posts.length === 1 ? "sighting" : "sightings"}
            </span>
          )}
        </div>
        <TownSelect id="forum-town" appearance="menu" value={townId} onChange={setTownId} allLabel="All towns" />
      </div>

      {(process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") && <SampleScanButton onPosted={slot.onRetry} />}

      {posts && posts.length === 0 && !slot.loading && !slot.error ? (
        <EmptyState
          action={
            <Link href="/forum/new" className={buttonVariants({ variant: "tinted", size: "sm" })}>
              Report a sighting
            </Link>
          }
        >
          {townId ? "No sightings reported in this town yet." : "No sightings reported yet. Seen a tick? Help Tick crack the case."}
        </EmptyState>
      ) : (
        <ForumPostList posts={posts} {...slot} />
      )}
    </Page>
  );
}

// Dev server and Vercel previews only: posts lib/fixtures/sample-scan.ts through createScanPost, like the scan screen will.
function SampleScanButton({ onPosted }: { onPosted: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="gray"
      size="sm"
      className="self-start"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await createScanPost(SAMPLE_SCAN);
          onPosted();
        } catch (err) {
          toast((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ScanLine className="size-4" aria-hidden />}
      Post sample scan (preview only)
    </Button>
  );
}
