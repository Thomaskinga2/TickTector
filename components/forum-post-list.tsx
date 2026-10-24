import { MessagesSquare } from "lucide-react";
import { formatRelative } from "@/components/format";
import { townName } from "@/components/map-utils";
import { slotStatus, type SlotProps } from "@/components/states";
import { List, ListRow } from "@/components/ui/list";
import type { ForumPost } from "@/lib/types";

// Sightings as an inset grouped list, newest first, like a Mail or Notes list. A post with a photo shows it
// as a thumbnail on the trailing side.
export function ForumPostList({ posts, ...slot }: { posts?: ForumPost[] } & SlotProps) {
  const status = slotStatus(slot, !posts?.length, "No sightings here yet. Be the first to report one.");
  if (status || !posts) return status;

  return (
    <List label="Sightings">
      {posts.map((post) => (
        <ListRow
          key={post.id}
          href={`/forum/${post.id}`}
          className="items-start py-3"
          trailing={
            post.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- user upload, served by /api/forum/photos
              <img src={post.photoUrl} alt="" loading="lazy" className="size-16 rounded-lg bg-fill object-cover" />
            )
          }
        >
          <span className="line-clamp-2 type-headline">{post.title}</span>
          <span className="mt-0.5 line-clamp-2 type-subhead text-muted-foreground">{post.body}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 type-footnote text-muted-foreground">
            {post.tickSpecies && (
              <span className="rounded-full bg-fill px-2 py-0.5 font-medium text-foreground">{post.tickSpecies}</span>
            )}
            <span>
              {townName(post.townId)} · {formatRelative(post.createdAt)}
            </span>
            {post.commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessagesSquare className="size-3.5" aria-hidden />
                {post.commentCount}
                <span className="sr-only"> {post.commentCount === 1 ? "comment" : "comments"}</span>
              </span>
            )}
          </span>
        </ListRow>
      ))}
    </List>
  );
}
