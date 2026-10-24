"use client";

import { Lightbulb, MessagesSquare, ShieldCheck } from "lucide-react";
import { ActionAlerts } from "@/components/action-alerts";
import { formatWeekRange } from "@/components/format";
import { FunFacts } from "@/components/fun-facts";
import { townName } from "@/components/map-utils";
import { NearbySightings } from "@/components/nearby-sightings";
import { Page } from "@/components/page";
import { RISK_LABEL } from "@/components/risk-badge";
import { RiskBasisDetails } from "@/components/risk-basis";
import { RiskReadout } from "@/components/risk-readout";
import { ShareButton } from "@/components/share-button";
import { SourcesFooter, SourcesProvider } from "@/components/sources";
import { Disclaimer } from "@/components/states";
import { TickCrawler } from "@/components/tick-crawler";
import { TickIcon } from "@/components/tick-icon";
import { TickSymbol } from "@/components/tick";
import { TickSpeciesList } from "@/components/tick-species-list";
import { TownModule } from "@/components/town-module";
import { getAlerts, getSpecies, getWeeklyRisk } from "@/lib/services/risk";
import type { RiskLevel } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

// The town page: the hero answers at a glance (the level's face, word and meadow), the modules hold the details.
export function AreaView({ townId }: { townId: string }) {
  const { data: risk, ...riskSlot } = useAsync(() => getWeeklyRisk(townId), [townId]);
  const { data: species, ...speciesSlot } = useAsync(() => getSpecies(townId), [townId]);
  const name = townName(townId);

  return (
    // Every module's sources are collected into one small line at the bottom (SourcesFooter).
    <SourcesProvider>
    <Page
        hero
        back={{ href: "/", label: "Towns" }}
        trailing={
          <ShareButton
            title={risk ? `${name}: ${RISK_LABEL[risk.level]} tick risk, week of ${formatWeekRange(risk.weekOf)}` : `${name} tick risk this week`}
            text={risk?.reason}
            className="glass text-foreground"
          />
        }
        title={risk ? `${name} · ${RISK_LABEL[risk.level]}` : name}
        className="gap-4"
      >
        <RiskReadout townId={townId} townName={name} risk={risk} {...riskSlot} />

        {risk && (
          <TownModule icon={ShieldCheck} title="What to do this week">
            <AlertsFor level={risk.level} />
          </TownModule>
        )}

        {risk?.basis && (
          // Tick, magnifying glass up, on the module that shows the evidence.
          <TownModule icon={TickSymbol} title="Tick’s evidence: why this level">
            <RiskBasisDetails basis={risk.basis} level={risk.level} townName={name} />
          </TownModule>
        )}

        {/* These wait for the risk to settle. Shown while the hero was still loading, they sat on screen in a short
            page, used up their one-time rise there, and were already in place by the time you scrolled to them. */}
        {!riskSlot.loading && (
          <>
            <TownModule icon={TickIcon} title="Ticks around here">
              <TickSpeciesList species={species} {...speciesSlot} />
            </TownModule>

            <TownModule icon={Lightbulb} title="Did you know?">
              <FunFacts />
            </TownModule>

            <TownModule icon={MessagesSquare} title="Sightings nearby">
              <NearbySightings townId={townId} />
            </TownModule>
          </>
        )}

        <TickCrawler seconds={22} />
        <Disclaimer />
        <SourcesFooter />
    </Page>
    </SourcesProvider>
  );
}

function AlertsFor({ level }: { level: RiskLevel }) {
  const { data: alerts, ...slot } = useAsync(() => getAlerts(level), [level]);
  return <ActionAlerts alerts={alerts} {...slot} />;
}
