import { riskFromIndex } from "@/components/map-utils";
import { RISK_LABEL } from "@/components/risk-badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { HeatmapPoint, RiskLevel } from "@/lib/types";

export type RiskFilterValue = "all" | RiskLevel;

const OPTIONS: RiskFilterValue[] = ["all", "high", "moderate", "low"];

// The map's level filter as an iOS segmented control. Levels with no towns are disabled.
export function RiskFilter({
  points,
  value,
  onChange,
}: {
  points: HeatmapPoint[];
  value: RiskFilterValue;
  onChange: (value: RiskFilterValue) => void;
}) {
  const count = (option: RiskFilterValue) =>
    option === "all" ? points.length : points.filter((p) => riskFromIndex(p.value) === option).length;

  return (
    <SegmentedControl
      label="Show towns by risk"
      value={value}
      onChange={onChange}
      segments={OPTIONS.map((option) => {
        const label = option === "all" ? "All" : RISK_LABEL[option];
        const n = count(option);
        return { value: option, label, accessibleLabel: `${label}, ${n} ${n === 1 ? "town" : "towns"}`, disabled: n === 0 };
      })}
    />
  );
}
