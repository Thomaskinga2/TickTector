"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ActionAlerts } from "@/components/action-alerts";
import { Heatmap, MapLegend } from "@/components/heatmap";
import { Page, Section } from "@/components/page";
import { RiskGauge } from "@/components/risk-gauge";
import { Disclaimer } from "@/components/states";
import { TickSpeciesList } from "@/components/tick-species-list";
import { TownCharts } from "@/components/town-charts";
import { getHeatmap } from "@/lib/services/heatmap";
import { getAlerts, getSpecies, getWeeklyRisk } from "@/lib/services/risk";
import { getTownStats } from "@/lib/services/stats";
import type { RiskLevel } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

export function AreaView({ townId }: { townId: string }) {
  const { data: stats, ...statsSlot } = useAsync(() => getTownStats(townId), [townId]);
  const { data: risk, ...riskSlot } = useAsync(() => getWeeklyRisk(townId), [townId]);
  const { data: species, ...speciesSlot } = useAsync(() => getSpecies(townId), [townId]);
  const { data: points, ...mapSlot } = useAsync(() => getHeatmap(), []);
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

      {stats?.note && (
        <blockquote className="flex flex-col gap-1 border-l-4 border-primary pl-4">
          <p>{stats.note.text}</p>
          <a href={stats.note.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground underline">
            {stats.note.source}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </blockquote>
      )}

      {risk && (
        <Section title="What to do this week">
          <AlertsFor level={risk.level} />
        </Section>
      )}

      <Section title="The numbers">
        <TownCharts stats={stats} {...statsSlot} />
      </Section>

      <Section title="Ticks in this area">
        <TickSpeciesList species={species} {...speciesSlot} />
      </Section>

      <Section title="Risk map">
        <Link href="/map" aria-label="Open the full risk map" className="flex flex-col gap-2 rounded-lg border bg-card p-2">
          <Heatmap points={points} compact county={town?.county} selectedTownId={townId} {...mapSlot} />
        </Link>
        <MapLegend />
      </Section>

      <Disclaimer />
    </Page>
  );
}

function AlertsFor({ level }: { level: RiskLevel }) {
  const { data: alerts, ...slot } = useAsync(() => getAlerts(level), [level]);
  return <ActionAlerts alerts={alerts} {...slot} />;
}
