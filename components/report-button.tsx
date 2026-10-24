"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportButton({ label }: { label: string }) {
  const [reported, setReported] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-11 px-3 text-muted-foreground"
      aria-label={label}
      disabled={reported}
      // TODO: send the report to a moderation endpoint (POST /api/forum/reports).
      onClick={() => setReported(true)}
    >
      <Flag className="size-4" aria-hidden />
      {reported ? "Reported" : "Report"}
    </Button>
  );
}
