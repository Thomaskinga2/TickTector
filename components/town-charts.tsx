"use client";

import { ChartCard, CompareBars, CompareLines, YearBars } from "@/components/charts";
import { slotStatus, type SlotProps } from "@/components/states";
import { DISEASE_LABEL } from "@/components/statewide-snapshot";
import type { DiseaseKey, TownStats } from "@/lib/types";

const DISEASES: DiseaseKey[] = ["lyme", "hga", "babesiosis"];
const FIRST_YEAR = 2011;

export const placeName = (county: string) => (county === "Dukes & Nantucket" ? "Dukes & Nantucket" : `${county} County`);

// Town page charts. All numbers are for the town's county (MA DPH doesn't publish town counts).
export function TownCharts({ stats, ...slot }: { stats?: TownStats } & SlotProps) {
  const status = slotStatus(slot, !stats, "No numbers for this area yet.");
  if (status || !stats) return status;

  const place = placeName(stats.county);
  const lastYear = stats.trend[stats.trend.length - 1];
  const years = Array.from({ length: (lastYear?.year ?? 2025) - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
  const ratio = stats.score / stats.stateScore;
  const compared = ratio >= 1.25 ? `${ratio.toFixed(1)} times the state rate` : ratio <= 0.8 ? "below the state rate" : "about the state rate";
  const er = stats.er.filter((e) => !e.period.includes("Jan")).at(-1);

  return (
    <div className="flex flex-col gap-4">
      <ChartCard
        title={`Cases in ${place} each year`}
        takeaway={lastYear ? `In ${lastYear.year}: ${DISEASES.map((d) => `${lastYear[d] ?? "no data for"} ${DISEASE_LABEL[d].toLowerCase()}`).join(", ")}.` : undefined}
        footnote="Lyme disease has gaps: DPH published no county Lyme numbers for 2015–2021, and counts cases differently since 2022. Source: MA DPH."
      >
        {DISEASES.map((d) => (
          <YearBars
            key={d}
            label={DISEASE_LABEL[d]}
            unit="cases"
            data={years.map((y) => ({ x: String(y), value: stats.trend.find((t) => t.year === y)?.[d] ?? null }))}
          />
        ))}
      </ChartCard>

      <ChartCard
        title="Compared with Massachusetts"
        takeaway={`${place} had ${Math.round(stats.score)} cases per 100,000 people in 2025, ${compared}.`}
        footnote="Cases per 100,000 people, 2025. Source: MA DPH."
      >
        <CompareBars
          placeLabel={place}
          unit="cases per 100,000 people"
          rows={stats.rates.map((r) => ({ label: DISEASE_LABEL[r.disease], place: r.county, state: r.state }))}
        />
      </ChartCard>

      <ChartCard
        title="ER visits for tick-borne disease"
        takeaway={er && er.county !== null ? `In ${er.period}, ${er.county} of every 10,000 ER visits in ${place} were for tick-borne disease (state: ${er.state}).` : undefined}
        footnote="Per 10,000 emergency department visits. 2026 is January–August. Source: MA DPH syndromic surveillance."
      >
        <CompareLines placeLabel={place} unit="per 10,000 ER visits" data={stats.er.map((e) => ({ x: e.period.replace(" (Jan–Aug)", "*"), place: e.county, state: e.state }))} />
      </ChartCard>
    </div>
  );
}
