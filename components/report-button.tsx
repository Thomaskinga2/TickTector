"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

// Reports a comment (posts are reported from their ⋯ menu). onReport sends it to POST /api/forum/posts/:id/reports.
export function ReportButton({ label, onReport, className }: { label: string; onReport: () => Promise<unknown>; className?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const reported = state === "done";
  return (
    <button
      type="button"
      aria-label={reported ? `${label} (reported)` : label}
      disabled={state === "sending" || reported}
      onClick={() => {
        setState("sending");
        onReport().then(
          () => setState("done"),
          () => setState("failed"),
        );
      }}
      className={cn(
        "pressable -ml-1 inline-flex min-h-11 items-center gap-1.5 self-start rounded-full px-1 type-subhead text-muted-foreground disabled:opacity-60",
        className,
      )}
    >
      <Flag className="size-4" aria-hidden />
      {reported ? "Reported. Thanks." : state === "failed" ? "Couldn't report. Try again" : "Report"}
    </button>
  );
}
