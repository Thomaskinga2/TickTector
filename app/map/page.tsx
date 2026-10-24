"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Heatmap } from "@/components/heatmap";
import { MapTownSearch } from "@/components/map-town-search";
import { Tick } from "@/components/tick";
import { riskFromIndex } from "@/components/map-utils";
import { Page, Section } from "@/components/page";
import { RiskFilter, type RiskFilterValue } from "@/components/risk-filter";
import { CountyRiskList } from "@/components/risk-town-list";
import { Disclaimer } from "@/components/states";
import { TownRiskCard } from "@/components/town-risk-card";
import { features } from "@/lib/features";
import { getHeatmap } from "@/lib/services/heatmap";
import { getCountyRisks } from "@/lib/services/risk";
import { smooth } from "@/lib/motion";
import { useAsync } from "@/lib/use-async";

export default function MapPage() {
  const { data: points, ...slot } = useAsync(() => getHeatmap(), []);
  const { data: counties } = useAsync(() => getCountyRisks(), []);
  const [filter, setFilter] = useState<RiskFilterValue>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardSlot = useRef<HTMLDivElement>(null);

  const visible = points?.filter((p) => filter === "all" || riskFromIndex(p.value) === filter);
  // A town hidden by the filter can't stay selected.
  const selected = visible?.some((p) => p.townId === selectedId) ? selectedId : null;
  const ready = features.heatmap && points && visible;

  return (
    <Page title="Risk Map" className="gap-4">
      <p className="-mt-3 px-0.5 type-subhead text-muted-foreground">All 351 cities and towns, shaded by this week&apos;s level.</p>

      <MapTownSearch
        levelOf={(id) => {
          const point = points?.find((p) => p.townId === id);
          return point && riskFromIndex(point.value);
        }}
        onPick={(id) => {
          // A town the level filter hides would be dropped from the selection; show all levels first.
          const point = points?.find((p) => p.townId === id);
          if (filter !== "all" && (!point || riskFromIndex(point.value) !== filter)) setFilter("all");
          setSelectedId(id);
        }}
      />

      {ready && <RiskFilter points={points} value={filter} onChange={setFilter} />}

      <Heatmap
        points={visible}
        selectedId={selected}
        onSelect={setSelectedId}
        hint={
          !selected && (
            <p className="glass flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1.5 type-footnote font-semibold text-foreground">
              <Tick size={22} />
              Tap a town to see why
            </p>
          )
        }
        {...slot}
      >
        {/* The card's slot grows open and folds shut, so the legend and the county list below slide instead of
            jumping by the card's height. The slot stays while you switch towns; the card inside is rebuilt per town.
            The -12px margin cancels the map frame's gap-3 while the slot is closed. */}
        <AnimatePresence>
          {selected && (
            <m.div
              key="town-card"
              initial={{ height: 0, marginTop: -12, opacity: 0 }}
              animate={{ height: "auto", marginTop: 0, opacity: 1 }}
              exit={{ height: 0, marginTop: -12, opacity: 0 }}
              transition={smooth}
              // On a small phone the card opens below the fold, behind the tab bar: once it's open, scroll just enough
              // to show it (scroll-mb clears the floating tab bar). Nothing moves when it already fits.
              onAnimationComplete={(target) => {
                if ((target as { height?: unknown }).height !== "auto") return;
                const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
                cardSlot.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
              }}
              ref={cardSlot}
              className="scroll-mb-24 overflow-hidden"
            >
              <TownRiskCard key={selected} townId={selected} onClose={() => setSelectedId(null)} />
            </m.div>
          )}
        </AnimatePresence>
      </Heatmap>

      {ready && (
        <>
          {counties && (
            <Section title="By county, highest risk first">
              <CountyRiskList risks={counties} />
            </Section>
          )}
          <Disclaimer />
        </>
      )}
    </Page>
  );
}
