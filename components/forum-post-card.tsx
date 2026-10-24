"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { Check, Ellipsis, Flag, MessageSquare, PenLine, ScanLine, Share, ThumbsUp } from "lucide-react";
import { TickIcon } from "@/components/tick-icon";
import { buttonVariants } from "@/components/ui/button";
import { likePost, reportPost } from "@/lib/services/forum";
import type { ForumPost } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAGE_LABEL = { larva: "Larva", nymph: "Nymph", adult: "Adult", unknown: "Unknown" };

// One post, laid out like an activity feed: author line, big title, stats, photos, then Like / Comment / Share.
// `full` is the post's own page: whole text, photos not linked. All user text renders as plain text.
export function ForumPostCard({ post, full = false }: { post: ForumPost; full?: boolean }) {
  const href = `/forum/${post.id}`;
  const scan = post.scan;
  const place = [post.townName, post.county && `${post.county} County`].filter(Boolean).join(", ");
  const [report, setReport] = useState<"done" | "failed" | null>(null);

  return (
    <article className="flex flex-col gap-4 overflow-hidden rounded-xl border bg-card pt-4">
      <header className="flex items-start gap-3 px-4">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-lg font-semibold text-secondary-foreground">
          {post.author.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate font-semibold">{post.author}</p>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            {scan ? <ScanLine className="mt-0.5 size-4 shrink-0" aria-label="Scan" /> : <PenLine className="mt-0.5 size-4 shrink-0" aria-label="Post" />}
            <span>
              <time dateTime={scan?.scannedAt ?? post.createdAt}>{formatDateTime(scan?.scannedAt ?? post.createdAt)}</time> · {place}
            </span>
          </p>
        </div>
        <PostMenu
          label={post.title || `post by ${post.author}`}
          reported={report === "done"}
          onReport={() => reportPost(post.id).then(() => setReport("done"), () => setReport("failed"))}
        />
      </header>

      {report && (
        <p role="status" className={cn("px-4 text-sm", report === "done" ? "text-muted-foreground" : "text-risk-high")}>
          {report === "done" ? "Thanks. A moderator will review this post." : "Couldn't send the report. Try again from the ⋯ menu."}
        </p>
      )}

      {post.title && (
        <h2 className="break-words px-4 text-2xl font-bold leading-tight tracking-tight">{full ? post.title : <Link href={href}>{post.title}</Link>}</h2>
      )}

      {scan ? (
        <dl className="grid grid-cols-3 gap-3 px-4">
          {scan.confidence !== undefined && <Stat label="Confidence" value={`${Math.round(scan.confidence * 100)}%`} />}
          <Stat label="Life stage" value={STAGE_LABEL[scan.stage ?? "unknown"]} />
          <Stat label="Location" value={post.townName} detail={post.county && `${post.county} County`} />
        </dl>
      ) : (
        (post.body || post.tickSpecies) && (
          <div className="flex flex-col gap-2 px-4">
            {post.body && <p className={cn("whitespace-pre-wrap break-words", !full && "line-clamp-4")}>{post.body}</p>}
            {post.tickSpecies && <p className="text-sm text-muted-foreground">Tick: {post.tickSpecies}</p>}
          </div>
        )
      )}

      {post.photos.length > 0 && <Photos post={post} linkTo={full ? undefined : href} />}

      {scan && (
        <div className="flex items-center gap-3 px-4">
          <TickIcon speciesId={scan.species} className="size-10 shrink-0" />
          <p className="min-w-0 flex-1 text-sm">Found with a tick scan. See this week&apos;s tick risk in {post.townName}.</p>
          <Link href={`/area/${post.townId}`} className={cn(buttonVariants({ size: "sm" }), "h-9 shrink-0 rounded-full px-4")}>
            See risk
          </Link>
        </div>
      )}

      <PostActions post={post} href={href} />
    </article>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words text-xl font-bold leading-tight">{value}</dd>
      {detail && <dd className="text-sm text-muted-foreground">{detail}</dd>}
    </div>
  );
}

function Photos({ post, linkTo }: { post: ForumPost; linkTo?: string }) {
  const alt = (i: number) => (post.scan ? `Scan photo of a ${post.title.toLowerCase()}` : `Photo ${i + 1} of ${post.photos.length} from ${post.author}`);
  const grid = (
    <div className={cn("grid gap-0.5", post.photos.length > 1 && "grid-cols-2")}>
      {post.photos.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads served by /api/forum/images
        <img key={src} src={src} alt={alt(i)} loading="lazy" className={cn("w-full bg-muted object-cover", post.photos.length > 1 ? "aspect-square" : "aspect-[4/3]")} />
      ))}
    </div>
  );
  return linkTo ? (
    <Link href={linkTo} aria-label={`Open ${post.title || "post"}`}>
      {grid}
    </Link>
  ) : (
    grid
  );
}

// Likes are remembered per browser (no accounts yet), so a second tap takes the like back.
const LIKED_KEY = "tiktector.forum.liked";
function likedIds(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(LIKED_KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}
function rememberLike(id: string, liked: boolean) {
  try {
    const rest = likedIds().filter((x) => x !== id);
    localStorage.setItem(LIKED_KEY, JSON.stringify(liked ? [...rest, id] : rest));
  } catch {
    // storage blocked: the like still counts, it just won't be remembered
  }
}

const ACTION = "flex h-11 items-center justify-center gap-2 rounded-lg text-muted-foreground hover:bg-muted";

function PostActions({ post, href }: { post: ForumPost; href: string }) {
  const [liked, setLiked] = useState(() => likedIds().includes(post.id));
  const [likes, setLikes] = useState(post.likeCount);
  const [shared, setShared] = useState<"copied" | "failed" | null>(null);

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    try {
      setLikes((await likePost(post.id, next)).likeCount);
      rememberLike(post.id, next);
    } catch {
      setLiked(!next);
      setLikes((n) => Math.max(0, n + (next ? -1 : 1)));
    }
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).href);
      setShared("copied");
    } catch {
      setShared("failed");
    }
    setTimeout(() => setShared(null), 2000);
  }

  return (
    <div className="grid grid-cols-3 border-t px-2 py-1">
      <button type="button" onClick={toggleLike} aria-pressed={liked} aria-label={`Like, ${likes} ${likes === 1 ? "like" : "likes"}`} className={cn(ACTION, liked && "text-primary")}>
        <ThumbsUp className={cn("size-6", liked && "fill-current")} aria-hidden />
        <span className="text-sm tabular-nums">{likes}</span>
      </button>
      <Link href={`${href}#comments`} aria-label={`Comments, ${post.commentCount}`} className={ACTION}>
        <MessageSquare className="size-6" aria-hidden />
        <span className="text-sm tabular-nums">{post.commentCount}</span>
      </Link>
      <button type="button" onClick={share} aria-label="Share: copy the link to this post" className={ACTION}>
        {shared === "copied" ? <Check className="size-6" aria-hidden /> : <Share className="size-6" aria-hidden />}
        {shared && (
          <span role="status" className="text-sm">
            {shared === "copied" ? "Link copied" : "Couldn't copy"}
          </span>
        )}
      </button>
    </div>
  );
}

function PostMenu({ label, reported, onReport }: { label: string; reported: boolean; onReport: () => void }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={`More options for ${label}`} className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted">
        <Ellipsis className="size-6" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={4} className="z-50">
          <Menu.Popup className="min-w-44 rounded-lg border bg-card p-1 shadow-lg outline-none">
            <Menu.Item
              disabled={reported}
              onClick={onReport}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-md px-3 outline-none data-[disabled]:cursor-default data-[disabled]:opacity-60 data-[highlighted]:bg-muted"
            >
              {reported ? <Check className="size-4" aria-hidden /> : <Flag className="size-4" aria-hidden />}
              {reported ? "Reported" : "Report post"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${date} at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}
