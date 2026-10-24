"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ForumPostList } from "@/components/forum-post-list";
import { Page } from "@/components/page";
import { TownSelect } from "@/components/town-select";
import { buttonVariants } from "@/components/ui/button";
import { getPosts } from "@/lib/services/forum";
import { useAsync } from "@/lib/use-async";
import { cn } from "@/lib/utils";

export default function ForumPage() {
  const [townId, setTownId] = useState("");
  const { data: posts, ...slot } = useAsync(() => getPosts(townId || undefined), [townId]);

  return (
    <Page title="Tick sightings">
      <Link href="/forum/new" className={cn(buttonVariants(), "h-12 text-base")}>
        <Plus className="size-5" aria-hidden />
        Report a sighting
      </Link>

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
