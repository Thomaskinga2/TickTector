import { MapPin } from "lucide-react";
import { formatRelative } from "@/components/format";
import { townName } from "@/components/map-utils";
import { ReportButton } from "@/components/report-button";
import type { ForumPost } from "@/lib/types";

// One sighting in full, on its own screen: the photo edge to edge on top, then the story.
// Tapping the photo opens it at full size.
export function ForumPostCard({ post }: { post: ForumPost }) {
  return (
    <article className="soft-block overflow-hidden">
      {post.photoUrl && (
        <a href={post.photoUrl} target="_blank" rel="noopener" aria-label="Open the photo at full size" className="block bg-fill">
          {/* eslint-disable-next-line @next/next/no-img-element -- user upload, served by /api/forum/photos */}
          <img src={post.photoUrl} alt={`Photo from ${post.author}: ${post.title}`} className="max-h-[420px] w-full object-cover" />
        </a>
      )}
      <div className="flex flex-col gap-3 px-4 pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <h2 className="type-title2 font-bold">{post.title}</h2>
          <p className="type-subhead text-muted-foreground">
            {post.author} · {formatRelative(post.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 rounded-full bg-fill px-3 py-1 type-subhead">
            <MapPin className="size-4 text-muted-foreground" aria-hidden />
            {townName(post.townId)}
            <span className="text-muted-foreground">· within about 1 km</span>
          </span>
          {post.tickSpecies && <span className="rounded-full bg-fill px-3 py-1 type-subhead font-medium">Tick: {post.tickSpecies}</span>}
        </div>
        <p className="type-body whitespace-pre-line">{post.body}</p>
        <ReportButton label={`Report post: ${post.title}`} />
      </div>
    </article>
  );
}
