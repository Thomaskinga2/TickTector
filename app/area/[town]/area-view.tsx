"use client";

import Link from "next/link";
import { ActionAlerts } from "@/components/action-alerts";
import { Heatmap } from "@/components/heatmap";
import { Page, Section } from "@/components/page";
import { RiskGauge } from "@/components/risk-gauge";
import { Disclaimer } from "@/components/states";
import { TickSpeciesList } from "@/components/tick-species-list";
import { getHeatmap } from "@/lib/services/heatmap";
import { getAlerts, getSpecies, getWeeklyRisk } from "@/lib/services/risk";
import type { RiskLevel } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

export function AreaView({ townId }: { townId: string }) {
  const { data: risk, ...riskSlot } = useAsync(() => getWeeklyRisk(townId), [townId]);
  const { data: species, ...speciesSlot } = useAsync(() => getSpecies(townId), [townId]);
  const { data: points, ...mapSlot } = useAsync(() => getHeatmap(), []);

  return (
    // TODO: show the real town name once a getTown(id) service exists; the slug stands in for now.
    <Page title={<span className="capitalize">{decodeURIComponent(townId).replace(/-/g, " ")}</span>}>
      <RiskGauge risk={risk} {...riskSlot} />

      {risk && (
        <Section title="What to do this week">
          <AlertsFor level={risk.level} />
        </Section>
      )}

      <Section title="Ticks in this area">
        <TickSpeciesList species={species} {...speciesSlot} />
      </Section>

      <Section title="Risk across Massachusetts">
        <Link href="/map" aria-label="Open the full risk map">
          <Heatmap points={points} compact {...mapSlot} />
        </Link>
      </Section>

      <Disclaimer />
    </Page>
  );
}

function AlertsFor({ level }: { level: RiskLevel }) {
  const { data: alerts, ...slot } = useAsync(() => getAlerts(level), [level]);
  return <ActionAlerts alerts={alerts} {...slot} />;
}
