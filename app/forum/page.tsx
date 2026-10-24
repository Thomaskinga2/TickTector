"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ForumNotice, ForumPostList } from "@/components/forum-post-list";
import { AccountRow } from "@/components/google-sign-in";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/states";
import { Page } from "@/components/page";
import { ScanPostComposer } from "@/components/scan-post-composer";
import { TownSelect } from "@/components/town-select";
import { getPosts } from "@/lib/services/forum";
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
          href="/forum/new" transitionTypes={["sheet-open"]}
          aria-label="Report a sighting"
          className="pressable grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_rgb(0_0_0/0.4)]"
        >
          <Plus className="size-6" strokeWidth={2.4} aria-hidden />
        </Link>
      }
    >
      <p className="-mt-3 px-0.5 type-subhead text-muted-foreground">Ticks your neighbors found or scanned, town by town.</p>
      <ForumNotice />
      <AccountRow prompt="Sign in with Google to post and comment. Reading is open to everyone." />

      {/* Opened by Scan's "Post tick" button (?post=<catch id>). */}
      <Suspense fallback={null}>
        <ScanPostComposer onPosted={slot.onRetry} />
      </Suspense>

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

      {posts && posts.length === 0 && !slot.loading && !slot.error ? (
        <EmptyState
          action={
            <Link href="/forum/new" transitionTypes={["sheet-open"]} className={buttonVariants({ variant: "tinted", size: "sm" })}>
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

