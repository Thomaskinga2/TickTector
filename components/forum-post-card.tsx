"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { Check, Ellipsis, Flag, MessagesSquare, PenLine, ScanLine, ThumbsUp } from "lucide-react";
import { formatRelative } from "@/components/format";
import { ShareButton } from "@/components/share-button";
import { TickSpeciesIcon } from "@/components/tick-species-icon";
import { toast } from "@/components/toaster";
import { buttonVariants } from "@/components/ui/button";
import { likePost, reportPost } from "@/lib/services/forum";
import type { ForumPost } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAGE_LABEL = { larva: "Larva", nymph: "Nymph", adult: "Adult", unknown: "Unknown" };

// One sighting, laid out like an activity feed: who and where, a big title, stats, the photos, then
// Like / Comment / Share. On its own page (`full`) the whole text shows and photos open at full size.
// All user text renders as plain text.
export function ForumPostCard({ post, full = false }: { post: ForumPost; full?: boolean }) {
  const href = `/forum/${post.id}`;
  const scan = post.scan;
  const when = scan?.scannedAt ?? post.createdAt;
  const place = [post.townName, post.county && `${post.county} County`].filter(Boolean).join(", ");

  return (
    <article className="soft-block overflow-hidden">
      <header className="flex items-start gap-3 px-4 pt-4">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-fill type-headline text-primary">
          {post.author.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate type-headline">{post.author}</p>
          <p className="flex items-start gap-1.5 type-footnote text-muted-foreground">
            {scan ? <ScanLine className="mt-px size-4 shrink-0" aria-label="Scan" /> : <PenLine className="mt-px size-4 shrink-0" aria-label="Post" />}
            <span>
              <time dateTime={when}>{formatRelative(when)}</time> · {place}
            </span>
          </p>
        </div>
        <PostMenu postId={post.id} label={post.title || `post by ${post.author}`} />
      </header>

      {post.title && <h2 className="break-words px-4 pt-3 type-title2 font-bold">{full ? post.title : <Link href={href}>{post.title}</Link>}</h2>}

      {scan ? (
        <dl className="grid grid-cols-3 gap-3 px-4 pt-3">
          {scan.confidence !== undefined && <Stat label="Confidence" value={`${Math.round(scan.confidence * 100)}%`} />}
          <Stat label="Life stage" value={STAGE_LABEL[scan.stage ?? "unknown"]} />
          <Stat label="Location" value={post.townName} detail={post.county && `${post.county} County`} />
        </dl>
      ) : (
        (post.body || post.tickSpecies) && (
          <div className="flex flex-col items-start gap-2 px-4 pt-2">
            {post.body && <p className={cn("break-words whitespace-pre-line type-body", !full && "line-clamp-4")}>{post.body}</p>}
            {post.tickSpecies && <span className="rounded-full bg-fill px-3 py-1 type-subhead font-medium">Tick: {post.tickSpecies}</span>}
          </div>
        )
      )}

      {post.photos.length > 0 && <Photos post={post} full={full} href={href} />}

      {scan && (
        <div className="flex items-center gap-3 px-4 pt-3">
          <TickSpeciesIcon speciesId={scan.species} className="size-10 shrink-0" />
          <p className="min-w-0 flex-1 type-subhead">Found with a tick scan. See this week&apos;s risk in {post.townName}.</p>
          <Link href={`/area/${post.townId}`} className={buttonVariants({ variant: "tinted", size: "sm" })}>
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
      <dt className="type-footnote text-muted-foreground">{label}</dt>
      <dd className="break-words type-title3 font-bold">{value}</dd>
      {detail && <dd className="type-footnote text-muted-foreground">{detail}</dd>}
    </div>
  );
}

// Edge to edge, like the screenshot's activity photo. In the feed they open the post; on the post they open full size.
function Photos({ post, full, href }: { post: ForumPost; full: boolean; href: string }) {
  const many = post.photos.length > 1;
  const alt = (i: number) => (post.scan ? `Scan photo of a ${post.title.toLowerCase()}` : `Photo ${i + 1} of ${post.photos.length} from ${post.author}`);
  const img = (src: string, i: number) => (
    // eslint-disable-next-line @next/next/no-img-element -- user upload, served by /api/forum/photos
    <img src={src} alt={alt(i)} loading="lazy" className={cn("w-full bg-fill object-cover", many ? "aspect-square" : "aspect-[4/3]")} />
  );
  return (
    <div className={cn("mt-3 grid gap-0.5", many && "grid-cols-2")}>
      {post.photos.map((src, i) =>
        full ? (
          <a key={src} href={src} target="_blank" rel="noopener" aria-label={`Open photo ${i + 1} at full size`}>
            {img(src, i)}
          </a>
        ) : (
          <Link key={src} href={href} aria-label={`Open ${post.title || "this post"}`} tabIndex={i ? -1 : undefined}>
            {img(src, i)}
          </Link>
        ),
      )}
    </div>
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

const ACTION = "pressable flex h-11 w-full items-center justify-center gap-2 rounded-lg type-subhead text-muted-foreground";

function PostActions({ post, href }: { post: ForumPost; href: string }) {
  const [liked, setLiked] = useState(() => likedIds().includes(post.id));
  const [likes, setLikes] = useState(post.likeCount);

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
      toast("Couldn't save the like");
    }
  }

  return (
    <div className="mt-3 grid grid-cols-3 border-t border-separator px-2 py-1">
      <button type="button" onClick={toggleLike} aria-pressed={liked} aria-label={`Like, ${likes} ${likes === 1 ? "like" : "likes"}`} className={cn(ACTION, liked && "text-primary")}>
        <ThumbsUp className={cn("size-[22px]", liked && "fill-current")} strokeWidth={2} aria-hidden />
        <span className="tabular-nums">{likes}</span>
      </button>
      <Link href={`${href}#comments`} aria-label={`Comments, ${post.commentCount}`} className={ACTION}>
        <MessagesSquare className="size-[22px]" strokeWidth={2} aria-hidden />
        <span className="tabular-nums">{post.commentCount}</span>
      </Link>
      <ShareButton title={post.title || "A tick sighting"} path={href} className={ACTION} />
    </div>
  );
}

// "⋯" holds Report. The result is confirmed with a toast, since the menu closes on tap.
function PostMenu({ postId, label }: { postId: string; label: string }) {
  const [reported, setReported] = useState(false);
  async function report() {
    try {
      await reportPost(postId);
      setReported(true);
      toast("Reported. Thanks.");
    } catch {
      toast("Couldn't send the report. Try again.");
    }
  }
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={`More options for ${label}`} className="pressable -mt-1.5 -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground">
        <Ellipsis className="size-6" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={4} className="z-50">
          <Menu.Popup className="glass min-w-48 rounded-2xl p-1.5 outline-none">
            <Menu.Item
              disabled={reported}
              onClick={report}
              className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl px-3 type-body outline-none data-[disabled]:cursor-default data-[disabled]:opacity-50 data-[highlighted]:bg-fill"
            >
              {reported ? <Check className="size-[18px]" aria-hidden /> : <Flag className="size-[18px]" aria-hidden />}
              {reported ? "Reported" : "Report post"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
