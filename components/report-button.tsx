"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

// Report a comment. Posts are reported from their ⋯ menu (forum-post-card.tsx).
export function ReportButton({ label, onReport }: { label: string; onReport: () => Promise<unknown> }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-11 px-3 text-muted-foreground"
      aria-label={label}
      disabled={state === "sending" || state === "done"}
      onClick={() => {
        setState("sending");
        onReport().then(() => setState("done"), () => setState("failed"));
      }}
    >
      <Flag className="size-4" aria-hidden />
      {state === "done" ? "Reported" : state === "failed" ? "Try again" : "Report"}
    </Button>
  );
}
