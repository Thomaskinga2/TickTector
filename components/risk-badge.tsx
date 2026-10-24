import { LevelFace } from "@/components/level-face";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

export const RISK_LABEL: Record<RiskLevel, string> = { low: "Low", moderate: "Moderate", high: "High" };

// The level's face and word, for legends and summaries. Risk is never shown by color alone.
export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 type-subhead font-medium", className)}>
      <LevelFace level={level} size={18} />
      {RISK_LABEL[level]}
    </span>
  );
}
