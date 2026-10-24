"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportButton({ label, className }: { label: string; className?: string }) {
  const [reported, setReported] = useState(false);
  return (
    <button
      type="button"
      aria-label={reported ? `${label} (reported)` : label}
      disabled={reported}
      // TODO: send the report to a moderation endpoint (POST /api/forum/reports).
      onClick={() => setReported(true)}
      className={cn(
        "pressable -ml-1 inline-flex min-h-11 items-center gap-1.5 self-start rounded-full px-1 type-subhead text-muted-foreground disabled:opacity-60",
        className,
      )}
    >
      <Flag className="size-4" aria-hidden />
      {reported ? "Reported. Thanks." : "Report"}
    </button>
  );
}
