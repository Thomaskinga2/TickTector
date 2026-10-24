import { LevelFace } from "@/components/level-face";
import { RISK_LABEL } from "@/components/risk-badge";
import { List, ListRow } from "@/components/ui/list";
import { countyLabel } from "@/lib/counties";
import { RISK_LEVELS, type CountyRisk } from "@/lib/types";

// The map's levels as an inset grouped list of counties (DPH's reporting unit), highest risk first,
// with each county's rate against the state. Also the way in for keyboard and screen reader users.
export function CountyRiskList({ risks }: { risks: CountyRisk[] }) {
  const ratio = (r: CountyRisk) => (r.basis ? r.basis.countyRate / r.basis.stateRate : 0);
  const sorted = [...risks].sort((a, b) => RISK_LEVELS.indexOf(b.level) - RISK_LEVELS.indexOf(a.level) || ratio(b) - ratio(a));

  return (
    <List label="Counties by risk">
      {sorted.map((risk) => (
        <ListRow key={risk.county} leading={<LevelFace level={risk.level} size={26} />} trailing={RISK_LABEL[risk.level]}>
          <span className="block">{countyLabel(risk.county)}</span>
          {risk.basis && (
            <span className="block type-footnote text-muted-foreground">
              {ratio(risk).toFixed(1)}× the all-county rate of tick-borne disease ER visits
            </span>
          )}
        </ListRow>
      ))}
    </List>
  );
}
