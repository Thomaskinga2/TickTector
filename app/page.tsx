"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LocationButton } from "@/components/location-button";
import { Page } from "@/components/page";
import { StatewideSnapshot } from "@/components/statewide-snapshot";
import { TOWN_SEARCH_ID, TownSearch } from "@/components/town-search";
import { buttonVariants } from "@/components/ui/button";
import type { Town } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const openTown = (town: Town) => router.push(`/area/${town.id}`);

  return (
    <Page className="gap-8 pt-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">TikTector</h1>
        <p className="text-lg text-muted-foreground">See this week&apos;s tick risk for your Massachusetts town.</p>
      </header>

      <TownSearch onSelect={openTown} />

      <div className="flex flex-col gap-3">
        <LocationButton onTown={openTown} onError={() => document.getElementById(TOWN_SEARCH_ID)?.focus()} />
        <Link href="/area/amherst" className={cn(buttonVariants({ variant: "secondary" }), "h-12 w-full text-base")}>
          Try Amherst
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Across Massachusetts</h2>
        <StatewideSnapshot />
      </section>
    </Page>
  );
}
