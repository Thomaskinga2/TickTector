"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, PresenceContext } from "motion/react";
import * as m from "motion/react-m";
import { ChevronLeft, ChevronRight, Loader2, LocateFixed, Search, X } from "lucide-react";
import { formatWeekRange } from "@/components/format";
import { RadarCard } from "@/components/radar-card";
import { LevelFace } from "@/components/level-face";
import { RISK_LABEL } from "@/components/risk-badge";
import { SourcesFooter, useCite } from "@/components/sources";
import { Disclaimer, EmptyState, ErrorState } from "@/components/states";
import { TickCrawler } from "@/components/tick-crawler";
import { Button } from "@/components/ui/button";
import { List, ListRow } from "@/components/ui/list";
import { countyLabel, dphCounty } from "@/lib/counties";
import { features } from "@/lib/features";
import { list, rise, swap } from "@/lib/motion";
import { getCountyRisks } from "@/lib/services/risk";
import { searchTowns } from "@/lib/services/towns";
import { RISK_LEVELS, type CountyRisk, type RiskLevel, type Town } from "@/lib/types";
import { useAsync } from "@/lib/use-async";
import { type NearMe, useNearMe } from "@/lib/use-near-me";
import { cn } from "@/lib/utils";

export const TOWN_SEARCH_ID = "town-search";
const MAX_RESULTS = 40;
const NEARBY = 5;
const LEVELS_DOWN = [...RISK_LEVELS].reverse();

// Home: towns near you first, then find your town, or browse by county. Mass. DPH reports by county, so counties are
// grouped under their level (each level a soft block with its face) and towns are plain rows that inherit their county's level.
export function TownBrowser() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [county, setCounty] = useState<string | null>(null);
  const { data: risks, ...risksSlot } = useAsync(() => getCountyRisks(), []);
  const { data: towns, ...townsSlot } = useAsync(() => searchTowns(""), []);
  const nearMe = useNearMe(features.geolocation);
  // Home's levels come from these; they're listed once in the small "Sources" line at the bottom.
  const listUrl = risks?.[0]?.basis?.dph.listUrl;
  useCite(
    listUrl
      ? [
          { name: "Mass. DPH tick-borne disease reports", url: listUrl },
          { name: "National Weather Service forecasts", url: "https://www.weather.gov/" },
          { name: "US Census Bureau town boundaries", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html" },
        ]
      : undefined,
  );

  const byCounty = new Map(risks?.map((r) => [r.county, r]));
  const riskOf = (town: Town) => byCounty.get(dphCounty(town.county));
  const rank = (r: CountyRisk) => RISK_LEVELS.indexOf(r.level) * 100 + (r.basis ? r.basis.countyRate / r.basis.stateRate : 0);
  const sortedCounties = [...(risks ?? [])].sort((a, b) => rank(b) - rank(a));
  const townCount = (c: string) => towns?.filter((t) => dphCounty(t.county) === c).length;

  const needle = query.trim().toLowerCase();
  const results = needle ? (towns ?? []).filter((t) => t.name.toLowerCase().startsWith(needle) || t.name.toLowerCase().includes(` ${needle}`)) : [];
  const week = risks?.[0]?.weekOf;

  const openCounty = (c: string | null) => {
    setCounty(c);
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Return opens the top match. */}
      <form
        role="search"
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) router.push(`/area/${results[0].id}`);
        }}
      >
        <label htmlFor={TOWN_SEARCH_ID} className="sr-only">
          Search Massachusetts cities and towns
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" strokeWidth={2.4} aria-hidden />
        <input
          id={TOWN_SEARCH_ID}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Search 351 cities and towns"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 w-full text-ellipsis rounded-full bg-fill pr-11 pl-10 type-body outline-none placeholder-shown:pr-4 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground"
          >
            <X className="size-[18px]" strokeWidth={2.4} aria-hidden />
          </button>
        )}
      </form>

      {/* The three views (counties, one county's towns, search results) swap in place with a short fade and rise. */}
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={risksSlot.error ? "error" : needle ? "search" : (county ?? "counties")} {...swap} className="flex flex-col gap-3">
          {/* initial={false} is meant for the view's own fade on page load only, but Motion hands it to everything
              inside, so the radar's boot, Tick's bubble and the county lists never animated in. A fresh presence
              context keeps their entrances. */}
          <PresenceContext value={null}>
          {risksSlot.error ? (
            <ErrorState message={risksSlot.error} onRetry={risksSlot.onRetry} />
          ) : needle ? (
            townsSlot.error ? (
              <ErrorState message={townsSlot.error} onRetry={townsSlot.onRetry} />
            ) : results.length === 0 ? (
              towns && <EmptyState puzzled>Tick searched everywhere: no Massachusetts city or town matches “{query.trim()}”.</EmptyState>
            ) : (
              <TownList towns={results.slice(0, MAX_RESULTS)} riskOf={riskOf} label="Search results" showCounty />
            )
          ) : county ? (
            <section aria-labelledby="county-title" className="flex flex-col gap-3">
              <button type="button" onClick={() => openCounty(null)} className="pressable -ml-1 flex items-center gap-0.5 self-start type-body text-primary">
                <ChevronLeft className="size-5" strokeWidth={2.4} aria-hidden />
                All counties
              </button>
              {byCounty.get(county) && <CountySummary risk={byCounty.get(county)!} towns={townCount(county)} />}
              <h2 id="county-title" className="px-1 pt-2 type-title3 font-semibold">
                Towns in {countyLabel(county)}
              </h2>
              <TownList towns={(towns ?? []).filter((t) => dphCounty(t.county) === county)} riskOf={riskOf} label={`Towns in ${countyLabel(county)}`} />
            </section>
          ) : (
            <>
              {features.geolocation && <NearYou {...nearMe} towns={towns ?? []} riskOf={riskOf} />}
              {risksSlot.loading && !risks ? (
                <div aria-label="Loading" className="h-[164px] animate-pulse rounded-3xl bg-fill" />
              ) : (
                risks && <RadarCard risks={risks} week={week} />
              )}
              <p className="px-1 pt-2 type-footnote text-muted-foreground">
                By county, highest risk first{week && <> · Week of {formatWeekRange(week)}</>}
              </p>
              {risksSlot.loading && !risks ? (
                <div aria-label="Loading counties" className="h-[220px] animate-pulse rounded-[22px] bg-fill" />
              ) : (
                LEVELS_DOWN.map((level) => {
                  const group = sortedCounties.filter((r) => r.level === level);
                  return (
                    group.length > 0 && (
                      <LevelBlock key={level} level={level} count={group.length}>
                        {group.map((risk) => (
                          <CountyRow key={risk.county} risk={risk} towns={townCount(risk.county)} onOpen={() => openCounty(risk.county)} />
                        ))}
                      </LevelBlock>
                    )
                  );
                })
              )}
            </>
          )}
          {/* The footer swaps with each view: outside it, it popped into place at full strength while a shorter
              view (search results) was still fading in above it. */}
          <TickCrawler className="mt-2" />
          <Disclaimer />
          <SourcesFooter />
          </PresenceContext>
        </m.div>
      </AnimatePresence>
    </div>
  );
}

// The town you're in and the closest others (by label point). Until a location is known, a button to share it.
function NearYou({
  near,
  locating,
  error,
  locate,
  towns,
  riskOf,
}: {
  near: NearMe | null;
  locating: boolean;
  error: string | null;
  locate: () => Promise<void>;
  towns: Town[];
  riskOf: (t: Town) => CountyRisk | undefined;
}) {
  // Errors from the automatic ask on load stay quiet (the button is the fallback); after a tap they show.
  const [tapped, setTapped] = useState(false);
  const retry = () => {
    setTapped(true);
    void locate();
  };

  if (!near) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="gray" className="w-full" onClick={retry} disabled={locating}>
          {locating ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <LocateFixed className="size-5" aria-hidden />}
          {locating ? "Finding towns near you…" : "Show towns near me"}
        </Button>
        {tapped && error && !locating && (
          <p role="alert" className="px-1 type-footnote text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  const { lat, lng } = near.coords;
  const cos = Math.cos((lat * Math.PI) / 180);
  const distance = (t: Town) => Math.hypot(t.lat - lat, (t.lng - lng) * cos);
  const others = towns.filter((t) => t.id !== near.town.id).sort((a, b) => distance(a) - distance(b));
  const nearby = [near.town, ...others].slice(0, NEARBY);

  return (
    <section aria-labelledby="near-title" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 id="near-title" className="type-title3 font-semibold">
          Near you
        </h2>
        {!near.precise && (
          <button type="button" onClick={retry} disabled={locating} className="pressable flex items-center gap-1 type-subhead text-primary">
            {locating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LocateFixed className="size-4" aria-hidden />}
            Use precise location
          </button>
        )}
      </div>
      <TownList towns={nearby} riskOf={riskOf} label="Towns near you" showCounty />
      <p className="px-1 type-footnote text-muted-foreground">
        {near.precise ? "From your device's location." : "Approximate, from your internet connection."}
      </p>
      {tapped && error && !locating && (
        <p role="alert" className="px-1 type-footnote text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}

// Home's counties, one soft block per level: the level's face and name on top, its counties as rows below.
function LevelBlock({ level, count, children }: { level: RiskLevel; count: number; children: ReactNode }) {
  const id = `level-${level}`;
  return (
    <section aria-labelledby={id} className={cn("soft-block", `level-block--${level}`)}>
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-1.5">
        <LevelFace level={level} size={40} />
        <h2 id={id} className="type-title3 font-semibold">
          {RISK_LABEL[level]} risk
        </h2>
        <span className="ml-auto type-footnote text-muted-foreground">
          {count} {count === 1 ? "county group" : "county groups"}
        </span>
      </div>
      <m.ul variants={list} initial="hidden" animate="show" className="level-rows">
        {children}
      </m.ul>
    </section>
  );
}

// One county: its name and towns, the week's highs, and how its tick ER visits compare. Opens its towns.
function CountyRow({ risk, towns, onOpen }: { risk: CountyRisk; towns?: number; onOpen: () => void }) {
  const forecast = risk.basis?.forecast;
  return (
    <m.li variants={rise}>
      <button type="button" onClick={onOpen} className="county-row flex min-h-14 w-full items-center gap-3 py-3 pr-3 pl-4 text-left">
        <span className="min-w-0 flex-1">
          <span className="block type-headline">{countyLabel(risk.county)}</span>
          <span className="block type-footnote text-muted-foreground">
            {/* Each fact stays on one line; the pair wraps between them. */}
            {towns !== undefined && <span className="whitespace-nowrap">{towns} cities and towns</span>}
            {towns !== undefined && forecast && " · "}
            {forecast && (
              <span className="whitespace-nowrap">
                Highs {forecast.highMin}–{forecast.highMax}°F
              </span>
            )}
          </span>
        </span>
        {/* The fact behind the level, short; the full sentence and sources are on each town's page. */}
        {risk.basis && (
          <span className="county-er">
            <span className="block type-headline tabular-nums">{(risk.basis.countyRate / risk.basis.stateRate).toFixed(1)}×</span>
            <span className="block type-caption2">
              ER visits<span className="sr-only"> for tick-borne disease, compared with all counties</span>
            </span>
          </span>
        )}
        <ChevronRight className="size-4 shrink-0 text-label-tertiary" strokeWidth={2.5} aria-hidden />
      </button>
    </m.li>
  );
}

// The county you opened: its face, level and facts above its towns.
function CountySummary({ risk, towns }: { risk: CountyRisk; towns?: number }) {
  const forecast = risk.basis?.forecast;
  return (
    <div className={cn("soft-block flex items-center gap-3.5 p-4", `level-block--${risk.level}`)}>
      <LevelFace level={risk.level} size={56} />
      <span className="flex min-w-0 flex-col">
        <span className="type-title3 font-semibold">{countyLabel(risk.county)}</span>
        <span className="level-ink type-subhead font-semibold">{RISK_LABEL[risk.level]} risk this week</span>
        <span className="type-footnote text-muted-foreground">
          {[
            towns !== undefined && `${towns} cities and towns`,
            risk.basis && `tick-borne disease ER visits ${(risk.basis.countyRate / risk.basis.stateRate).toFixed(1)}× all counties`,
            forecast && `highs ${forecast.highMin}–${forecast.highMax}°F`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
    </div>
  );
}

// `showCounty` for search results; a county's own list doesn't repeat its name on every row.
function TownList({
  towns,
  riskOf,
  label,
  showCounty = false,
}: {
  towns: Town[];
  riskOf: (t: Town) => CountyRisk | undefined;
  label: string;
  showCounty?: boolean;
}) {
  return (
    <List label={label}>
      {towns.map((town) => {
        const risk = riskOf(town);
        return (
          <ListRow
            key={town.id}
            href={`/area/${town.id}`}
            leading={risk && <LevelFace level={risk.level} size={26} />}
            trailing={risk && `${RISK_LABEL[risk.level]} risk`}
          >
            <span className="block truncate">{town.name}</span>
            {showCounty && <span className="block type-footnote text-muted-foreground">{countyLabel(town.county)}</span>}
          </ListRow>
        );
      })}
    </List>
  );
}
