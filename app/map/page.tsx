"use client";

import { Heatmap } from "@/components/heatmap";
import { Page } from "@/components/page";
import { getHeatmap } from "@/lib/services/heatmap";
import { useAsync } from "@/lib/use-async";

export default function MapPage() {
  const { data: points, ...slot } = useAsync(() => getHeatmap(), []);

  return (
    <Page title="Risk map" className="gap-4">
      <Heatmap points={points} {...slot} />
    </Page>
  );
}
