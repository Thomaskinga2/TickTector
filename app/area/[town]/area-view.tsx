"use client";

import { ExternalLink } from "lucide-react";
import { Page, Section } from "@/components/page";
import { RiskGauge } from "@/components/risk-gauge";
import { Disclaimer, slotStatus } from "@/components/states";
import { TickSpeciesList } from "@/components/tick-species-list";
import { getSpecies, getWeeklyRisk } from "@/lib/services/risk";
import { getTownStats } from "@/lib/services/stats";
import { getWeather } from "@/lib/services/weather";
import { useAsync } from "@/lib/use-async";

export function AreaView({ townId }: { townId: string }) {
  const { data: stats } = useAsync(() => getTownStats(townId), [townId]);
  const { data: risk, ...riskSlot } = useAsync(() => getWeeklyRisk(townId), [townId]);
  const { data: species, ...speciesSlot } = useAsync(() => getSpecies(townId), [townId]);
  const town = stats?.town;

  return (
    <Page
      title={
        <span className="flex flex-col">
          {/* The slug stands in until stats load. */}
          <span className="capitalize">{town?.name ?? decodeURIComponent(townId).replace(/-/g, " ")}</span>
          {town && <span className="text-base font-normal text-muted-foreground">{town.county} County</span>}
        </span>
      }
    >
      <RiskGauge risk={risk} {...riskSlot} />

      <TodayWeather townId={townId} />

      {stats && (
        <p className="rounded-lg border bg-card p-4">
          <span className="font-semibold">Tick fact: </span>
          {stats.fact}
        </p>
      )}

      {stats?.note && (
        <blockquote className="flex flex-col gap-1 border-l-4 border-primary pl-4">
          <p>{stats.note.text}</p>
          <a href={stats.note.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground underline">
            {stats.note.source}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </blockquote>
      )}

      <Section title="Ticks in this area">
        <TickSpeciesList species={species} {...speciesSlot} />
      </Section>

      <Disclaimer />
    </Page>
  );
}

function TodayWeather({ townId }: { townId: string }) {
  const { data: weather, ...slot } = useAsync(() => getWeather(townId), [townId]);
  const status = slotStatus(slot, !weather, "No weather for this town yet.");
  if (status || !weather) return status;
  return (
    <section aria-label="Weather today" className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <p className="text-lg font-semibold leading-snug">{weather.summary}</p>
      <p className="text-muted-foreground">{weather.ticks}</p>
    </section>
  );
}
