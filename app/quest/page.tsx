// Quest tab: the Tickdex, a Pokédex of the ticks caught with Scan (stored on this device, lib/tickdex.ts).
// /quest?new=<catch id> plays the "registered" moment for that catch; /quest?demo=1 shows sample and reset tools.

import { Suspense } from "react";
import { Page } from "@/components/page";
import { PhotoCredits } from "@/components/photo-credits";
import { ComingSoon } from "@/components/states";
import { Tickdex, TickdexSkeleton } from "@/components/tickdex";
import { tickdexDisplay } from "@/components/tickdex-font";
import { features } from "@/lib/features";

export default function QuestPage() {
  return (
    <Page className={tickdexDisplay.variable}>
      {features.quest ? (
        // The Tickdex reads the URL (?new=, ?demo=) and localStorage, so it renders in the browser only.
        <>
          <Suspense fallback={<TickdexSkeleton />}>
            <Tickdex />
          </Suspense>
          <PhotoCredits />
        </>
      ) : (
        <ComingSoon title="Tickdex">Collect every tick you catch with Scan. Coming soon.</ComingSoon>
      )}
    </Page>
  );
}
