import Link from "next/link";
import { MapPin, MessagesSquare } from "lucide-react";
import { ReportButton } from "@/components/report-button";
import type { ForumPost } from "@/lib/types";

// `full` shows the whole body and photo (detail page); otherwise the card links to the detail page.
export function ForumPostCard({ post, full = false }: { post: ForumPost; full?: boolean }) {
  const heading = <h2 className="text-lg font-semibold leading-snug">{post.title}</h2>;

  return (
    <article className="flex flex-col gap-2 rounded-lg border bg-card p-4">
      {full ? heading : <Link href={`/forum/${post.id}`} className="after:absolute after:inset-0">{heading}</Link>}
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="size-4" aria-hidden />
        <span>
          <span className="capitalize">{post.townId.replace(/-/g, " ")}</span>, about 1 km area
        </span>
      </p>
      <p className={full ? "" : "line-clamp-2"}>{post.body}</p>
      {/* TODO: show the photo once uploads are stored (photoUrl). */}
      {full && post.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- user upload from storage
        <img src={post.photoUrl} alt={`Photo for ${post.title}`} className="max-h-72 w-full rounded-lg object-cover" />
      )}
      {post.tickSpecies && <p className="text-sm">Tick: {post.tickSpecies}</p>}
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {post.author}, {formatDate(post.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          {!full && (
            <>
              <MessagesSquare className="size-4" aria-hidden />
              {post.commentCount}
            </>
          )}
          <span className="relative z-10">
            <ReportButton label={`Report post: ${post.title}`} />
          </span>
        </span>
      </div>
    </article>
  );
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
