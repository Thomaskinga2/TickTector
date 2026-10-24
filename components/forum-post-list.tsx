import { ExternalLink } from "lucide-react";
import { ForumPostCard } from "@/components/forum-post-card";
import { slotStatus, type SlotProps } from "@/components/states";
import type { ForumPost } from "@/lib/types";

export function ForumPostList({ posts, ...slot }: { posts?: ForumPost[] } & SlotProps) {
  const status = slotStatus(slot, !posts?.length, "No sightings here yet. Be the first to report one.");
  if (status || !posts) return status;

  return (
    <ul className="flex flex-col gap-4">
      {posts.map((post) => (
        <li key={post.id}>
          <ForumPostCard post={post} />
        </li>
      ))}
    </ul>
  );
}

// Shown on every forum page.
export function ForumNotice() {
  return (
    <p role="note" className="border-l-4 border-primary pl-4 text-sm">
      Community reports, not medical advice. If you were bitten and feel unwell, see a doctor.{" "}
      <a
        href="https://www.mass.gov/service-details/tick-identification-and-testing-services"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 underline"
      >
        Tick identification and testing (Mass.gov)
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </p>
  );
}
