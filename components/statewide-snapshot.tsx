"use client";

import { useRouter } from "next/navigation";
import { ChartCard, RankBars, YearBars } from "@/components/charts";
import { slotStatus } from "@/components/states";
import { getStatewideStats } from "@/lib/services/stats";
import type { DiseaseKey } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

export const DISEASE_LABEL: Record<DiseaseKey, string> = { lyme: "Lyme disease", hga: "Anaplasmosis", babesiosis: "Babesiosis" };

// Home page: which counties are worst, and how cases have changed statewide.
export function StatewideSnapshot() {
  const router = useRouter();
  const { data, ...slot } = useAsync(() => getStatewideStats(), []);
  const status = slotStatus(slot, !data?.counties.length, "Statewide numbers aren't available right now.");
  if (status || !data) return status;

  const top = data.counties[0];
  const bottom = data.counties[data.counties.length - 1];
  const latest = [...data.years].reverse().find((y) => !y.partial)!;

  return (
    <div className="flex flex-col gap-4">
      <ChartCard
        title="Tick-borne disease by county"
        takeaway={`${top.county} has the highest rate, about ${Math.round(top.score / bottom.score)} times ${bottom.county}.`}
        footnote="Cases per 100,000 people in 2025: Lyme disease, babesiosis and anaplasmosis combined. Tap a county to open its largest town. Source: MA DPH."
      >
        <RankBars
          rows={data.counties.map((c) => ({ id: c.townId, label: c.county, value: c.score, level: c.level }))}
          unit="cases per 100,000 people"
          onSelect={(townId) => router.push(`/area/${townId}`)}
        />
      </ChartCard>

      <ChartCard
        title="Cases reported in Massachusetts"
        takeaway={`In ${latest.year}: ${latest.lyme.toLocaleString()} Lyme, ${latest.hga.toLocaleString()} anaplasmosis and ${latest.babesiosis.toLocaleString()} babesiosis cases.`}
        footnote="Lyme counts aren't comparable across years: DPH changed how it counts cases in 2016 and again in 2022. The lighter bar is 2026 so far (through September). Source: MA DPH."
      >
        {(["lyme", "hga", "babesiosis"] as DiseaseKey[]).map((d) => (
          <YearBars key={d} label={DISEASE_LABEL[d]} unit="cases" data={data.years.map((y) => ({ x: y.year, value: y[d], partial: y.partial }))} />
        ))}
      </ChartCard>
    </div>
  );
}
