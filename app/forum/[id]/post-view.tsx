"use client";

import { useState } from "react";
import { CommentThread } from "@/components/comment-thread";
import { ForumPostCard } from "@/components/forum-post-card";
import { Page, Section } from "@/components/page";
import { Disclaimer, slotStatus } from "@/components/states";
import { toast } from "@/components/toaster";
import { addComment, getComments, getPost } from "@/lib/services/forum";
import type { ForumComment } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

export function PostView({ postId }: { postId: string }) {
  const { data: post, ...postSlot } = useAsync(() => getPost(postId), [postId]);
  const { data: comments, ...commentsSlot } = useAsync(() => getComments(postId), [postId]);
  // Comments sent from this page, shown without refetching the thread.
  const [sent, setSent] = useState<ForumComment[]>([]);

  return (
    <Page title="Sighting" largeTitle={false} back={{ href: "/forum", label: "Sightings" }}>
      {slotStatus(postSlot, !post, "This post doesn't exist or was removed.") ??
        (post && (
          <>
            <ForumPostCard post={post} />
            <Section title="Comments">
              <CommentThread
                comments={comments && [...comments, ...sent.filter((s) => !comments.some((c) => c.id === s.id))]}
                {...commentsSlot}
                onSend={async (body, author) => {
                  const comment = await addComment(postId, body, author);
                  setSent((prev) => [...prev, comment]);
                  toast("Comment added");
                }}
              />
            </Section>
            <Disclaimer />
          </>
        ))}
    </Page>
  );
}
