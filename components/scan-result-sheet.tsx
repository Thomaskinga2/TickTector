"use client";

import Link from "next/link";
import { RotateCcw, Sparkles } from "lucide-react";
import { Disclaimer } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { PAPER } from "@/lib/capture/draw-diagram";
import { cn } from "@/lib/utils";

type Props = { entryId: string | null; offline: boolean; onScanAgain: () => void };

// The buttons under the finished life-cycle diagram. The sheet takes the canvas's paper colour
// (a fixed game colour) so it reads as part of the diagram in both themes.
export function ScanResultSheet({ entryId, offline, onScanAgain }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[110] flex flex-col items-center gap-2 px-4 pt-6 pb-[max(14px,env(safe-area-inset-bottom))] text-center text-[#3b4436]"
      style={{ background: `linear-gradient(to bottom, transparent, ${PAPER} 22px)` }}
    >
      <div className="flex w-full max-w-sm gap-2">
        <button type="button" onClick={onScanAgain} className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1 text-[15px]")}>
          <RotateCcw aria-hidden />
          Scan again
        </button>
        <Link href={entryId ? `/quest?new=${encodeURIComponent(entryId)}` : "/quest"} className={cn(buttonVariants(), "h-11 flex-[1.4] text-[15px]")}>
          <Sparkles aria-hidden />
          See it in your Tickdex
        </Link>
      </div>
      <div className="flex flex-col text-xs leading-snug [&_p]:text-xs [&_p]:text-[#5b6957]">
        <p>
          Demo: a bean stands in for a tick.{offline && <span className="font-semibold"> Offline result.</span>}
        </p>
        <Disclaimer />
      </div>
    </div>
  );
}
