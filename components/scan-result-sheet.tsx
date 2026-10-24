"use client";

import Link from "next/link";
import { MessagesSquare, RotateCcw, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PAPER } from "@/lib/capture/draw-diagram";
import { useTickdex } from "@/lib/use-tickdex";
import { cn } from "@/lib/utils";

type Props = { entryId: string | null; offline: boolean; onScanAgain: () => void };

// The bar under the finished life-cycle diagram, in the canvas's paper (the app's card colour) so the two read as
// one screen. It sits below the canvas, never over it: the diagram re-fits into the space above.
export function ScanResultSheet({ entryId, offline, onScanAgain }: Props) {
  // "Post tick" opens Sightings with this catch (components/scan-post-composer.tsx). Sample scans have no photo to post.
  const canPost = !!useTickdex().find((c) => c.id === entryId)?.photo;
  return (
    <div
      className="fade-in flex shrink-0 flex-col items-center gap-2 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center"
      style={{ background: PAPER }}
    >
      <div className="grid w-full max-w-sm grid-cols-2 gap-2">
        {canPost && entryId && (
          <Link href={`/forum?post=${encodeURIComponent(entryId)}`} className={cn(buttonVariants(), "col-span-2 px-3")}>
            <MessagesSquare aria-hidden />
            Post tick
          </Link>
        )}
        <button type="button" onClick={onScanAgain} className={cn(buttonVariants({ variant: "gray" }), "px-3")}>
          <RotateCcw aria-hidden />
          Scan again
        </button>
        <Link href={entryId ? `/quest?new=${encodeURIComponent(entryId)}` : "/quest"} className={cn(buttonVariants({ variant: canPost ? "tinted" : "default" }), "px-3")}>
          <Sparkles aria-hidden />
          Tickdex
        </Link>
      </div>
      <p className="max-w-sm type-caption1 text-muted-foreground">
        Demo: the tick is simulated. Information only, not medical advice.
        {offline && <span className="font-semibold"> You&apos;re offline, so it wasn&apos;t sent.</span>}
      </p>
    </div>
  );
}
