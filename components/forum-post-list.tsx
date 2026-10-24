import { ForumPostCard } from "@/components/forum-post-card";
import { slotStatus, type SlotProps } from "@/components/states";
import type { ForumPost } from "@/lib/types";

export function ForumPostList({ posts, ...slot }: { posts?: ForumPost[] } & SlotProps) {
  const status = slotStatus(slot, !posts?.length, "No sightings here yet. Be the first to report one.");
  if (status || !posts) return status;

  return (
    <ul className="flex flex-col gap-3">
      {posts.map((post) => (
        <li key={post.id} className="relative">
          <ForumPostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
