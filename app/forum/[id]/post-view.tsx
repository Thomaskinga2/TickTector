"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CommentThread } from "@/components/comment-thread";
import { ForumPostCard } from "@/components/forum-post-card";
import { ForumNotice } from "@/components/forum-post-list";
import { Page } from "@/components/page";
import { slotStatus } from "@/components/states";
import { addComment, getComments, getPost, reportPost } from "@/lib/services/forum";
import type { ForumComment } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

export function PostView({ postId }: { postId: string }) {
  const { data: post, ...postSlot } = useAsync(() => getPost(postId), [postId]);
  const { data: comments, ...commentsSlot } = useAsync(() => getComments(postId), [postId]);
  // Comments sent from this page, shown without refetching the thread.
  const [sent, setSent] = useState<ForumComment[]>([]);

  return (
    <Page>
      <Link href="/forum" className="flex h-11 items-center gap-2 self-start text-muted-foreground">
        <ArrowLeft className="size-5" aria-hidden />
        All sightings
      </Link>

      {slotStatus(postSlot, !post, "This post doesn't exist or was removed.") ??
        (post && (
          <>
            <ForumPostCard post={post} full />
            <section id="comments" className="flex scroll-mt-4 flex-col gap-3">
              <h2 className="text-xl font-semibold">Comments</h2>
              <CommentThread
                comments={comments && [...comments, ...sent.filter((s) => !comments.some((c) => c.id === s.id))]}
                {...commentsSlot}
                onSend={async (body, author) => {
                  const comment = await addComment(postId, body, author);
                  setSent((prev) => [...prev, comment]);
                }}
                onReport={(commentId) => reportPost(postId, commentId)}
              />
            </section>
            <ForumNotice />
          </>
        ))}
    </Page>
  );
}
