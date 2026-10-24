import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

export const RISK_LABEL: Record<RiskLevel, string> = { low: "Low", moderate: "Moderate", high: "High" };

// Literal class names so Tailwind picks them up.
export const RISK_BG: Record<RiskLevel, string> = {
  low: "bg-risk-low",
  moderate: "bg-risk-moderate",
  high: "bg-risk-high",
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", className)}>
      <span className={cn("size-2.5 rounded-full", RISK_BG[level])} aria-hidden />
      {RISK_LABEL[level]}
    </span>
  );
}
