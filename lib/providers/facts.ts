import { countyLabel } from "@/lib/counties";
import { FACTS } from "@/lib/mock-data";
import { getDphBaseline } from "@/lib/providers/dph";
import { periodLabel } from "@/lib/providers/risk";
import type { TickFact } from "@/lib/types";

// Server-only: the cited facts, plus a few worked out from the newest Mass. DPH report so they update with it.
export async function getFacts(): Promise<TickFact[]> {
  const dph = await getDphBaseline();
  const period = periodLabel(dph.period);
  const month = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(`${dph.period.to}-01T00:00:00Z`));
  const source = {
    name: `Mass. DPH, Tick Exposure and Tick-borne Disease Syndromic Surveillance Report, ${month} ${dph.period.to.slice(0, 4)}, Table 1`,
    url: dph.reportUrl,
  };
  const rows = Object.entries(dph.counties).sort(([, a], [, b]) => b.rate - a.rate);
  const [topName, top] = rows[0];
  const [lowName, low] = rows.at(-1)!;
  const visits = rows.reduce((sum, [, r]) => sum + r.tickVisits, 0);

  const live: TickFact[] = [
    {
      id: "dph-total",
      text: `Massachusetts residents made ${visits.toLocaleString("en-US")} ER visits that were diagnosed as a tick-borne disease, ${period}.`,
      source,
    },
    {
      id: "dph-top",
      text: `${countyLabel(topName)} has the highest rate of tick-borne disease ER visits in the state: ${top.rate.toFixed(2)} per 10,000 ER visits, ${(top.rate / dph.stateRate).toFixed(1)}× the all-county rate (${period}).`,
      source,
    },
    {
      id: "dph-low",
      text: `${countyLabel(lowName)} has the lowest rate: ${low.rate.toFixed(2)} per 10,000 ER visits. ${countyLabel(topName)}'s is about ${Math.round(top.rate / low.rate)} times higher (${period}).`,
      source,
    },
  ];
  return [...live, ...FACTS];
}
