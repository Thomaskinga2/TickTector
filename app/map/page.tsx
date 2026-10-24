"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Heatmap, MapLegend } from "@/components/heatmap";
import { Page } from "@/components/page";
import { RiskBadge } from "@/components/risk-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { features } from "@/lib/features";
import { getHeatmap } from "@/lib/services/heatmap";
import { useAsync } from "@/lib/use-async";
import { cn } from "@/lib/utils";

export default function MapPage() {
  const { data: points, ...slot } = useAsync(() => getHeatmap(), []);
  const [county, setCounty] = useState("");
  const [townId, setTownId] = useState<string | null>(null);
  const counties = [...new Set(points?.map((p) => p.county))].sort();
  const town = points?.find((p) => p.townId === townId);

  return (
    <Page title="Risk map" className="gap-4">
      <p className="text-muted-foreground">Tap a town to see its tick risk this week.</p>

      {features.heatmap && (
        <div className="flex gap-2">
          <label htmlFor="map-county" className="sr-only">
            Zoom to a county
          </label>
          <select
            id="map-county"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-lg border bg-card px-3 text-base"
          >
            <option value="">All of Massachusetts</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c} County
              </option>
            ))}
          </select>
          {county && (
            <Button variant="outline" className="h-11 px-3 text-base" onClick={() => setCounty("")}>
              Show all
            </Button>
          )}
        </div>
      )}

      <Heatmap points={points} {...slot} county={county || undefined} selectedTownId={townId} onSelectTown={setTownId} />
      {features.heatmap && <MapLegend />}

      <div aria-live="polite">
        {town && (
          <section className="flex flex-col gap-2 rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{town.name}</p>
                <p className="text-sm text-muted-foreground">{town.county} County</p>
              </div>
              <RiskBadge level={town.level} className="shrink-0" />
            </div>
            <p className="text-sm">{Math.round(town.score)} tick-borne disease cases per 100,000 people in its county in 2025.</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/area/${town.townId}`} className={cn(buttonVariants(), "h-11 px-4 text-base")}>
                See details
                <ChevronRight className="size-4" aria-hidden />
              </Link>
              {county !== town.county && (
                <Button variant="outline" className="h-11 px-4 text-base" onClick={() => setCounty(town.county)}>
                  Zoom to {town.county} County
                </Button>
              )}
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}
