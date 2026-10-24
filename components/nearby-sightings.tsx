"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { formatRelative } from "@/components/format";
import { slotStatus } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { getPosts } from "@/lib/services/forum";
import { useAsync } from "@/lib/use-async";
import { cn } from "@/lib/utils";

const SHOWN = 3;

// The latest sightings reported in this town, linking into the forum.
export function NearbySightings({ townId }: { townId: string }) {
  const { data: posts, ...slot } = useAsync(() => getPosts(townId), [townId]);
  const status = slotStatus(slot, !posts?.length, "No sightings reported here yet.");

  return (
    <div className="flex flex-col gap-3">
      {status ?? (
        <ul className="flex flex-col divide-y divide-separator">
          {posts?.slice(0, SHOWN).map((post) => (
            <li key={post.id}>
              <Link href={`/forum/${post.id}`} className="flex items-center gap-3 py-2.5 first:pt-0">
                <span className="min-w-0 flex-1">
                  <span className="block truncate type-headline">{post.title}</span>
                  <span className="block type-footnote text-muted-foreground">
                    {post.author} · {formatRelative(post.createdAt)}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-label-tertiary" strokeWidth={2.5} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/forum/new" className={cn(buttonVariants({ variant: "gray", size: "sm" }), "self-start")}>
        <Plus className="size-4" strokeWidth={2.6} aria-hidden />
        Report a sighting
      </Link>
    </div>
  );
}
