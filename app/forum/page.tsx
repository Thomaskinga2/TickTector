"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus, ScanLine } from "lucide-react";
import { ForumNotice, ForumPostList } from "@/components/forum-post-list";
import { Page } from "@/components/page";
import { TownSelect } from "@/components/town-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { SAMPLE_SCAN } from "@/lib/fixtures/sample-scan";
import { createScanPost, getPosts } from "@/lib/services/forum";
import { useAsync } from "@/lib/use-async";
import { cn } from "@/lib/utils";

export default function ForumPage() {
  const [townId, setTownId] = useState("");
  const { data: posts, ...slot } = useAsync(() => getPosts(townId || undefined), [townId]);

  return (
    <Page title="Tick sightings">
      <ForumNotice />

      <Link href="/forum/new" className={cn(buttonVariants(), "h-12 text-base")}>
        <Plus className="size-5" aria-hidden />
        Report a sighting
      </Link>

      {(process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") && <SampleScanButton onPosted={slot.onRetry} />}

      <div className="flex flex-col gap-2">
        <label htmlFor="forum-town" className="font-medium">
          Show sightings in
        </label>
        <TownSelect id="forum-town" value={townId} onChange={setTownId} allLabel="All towns" />
      </div>

      <ForumPostList posts={posts} {...slot} />
    </Page>
  );
}

// Dev server and Vercel previews only: posts lib/fixtures/sample-scan.ts through createScanPost, like the scan screen will.
function SampleScanButton({ onPosted }: { onPosted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        className="h-12 border-dashed text-base"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await createScanPost(SAMPLE_SCAN);
            onPosted();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ScanLine className="size-5" aria-hidden />}
        Post sample scan (preview only)
      </Button>
      {error && (
        <p role="alert" className="text-sm text-risk-high">
          {error}
        </p>
      )}
    </div>
  );
}
