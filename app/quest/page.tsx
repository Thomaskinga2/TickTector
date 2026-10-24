// Quest tab: the Tickdex, a collection of the ticks caught with Scan (stored on this device, lib/tickdex.ts).
// /quest?new=<catch id> plays the "registered" moment for that catch; /quest?demo=1 shows sample and reset tools.

import { Suspense } from "react";
import { Compass } from "lucide-react";
import { Page } from "@/components/page";
import { PhotoCredits } from "@/components/photo-credits";
import { ComingSoon, Disclaimer } from "@/components/states";
import { Tickdex, TickdexSkeleton } from "@/components/tickdex";
import { features } from "@/lib/features";

export default function QuestPage() {
  return (
    <Page title="TickQuest">
      {features.quest ? (
        // The Tickdex reads the URL (?new=, ?demo=) and localStorage, so it renders in the browser only.
        <>
          <Suspense fallback={<TickdexSkeleton />}>
            <Tickdex />
          </Suspense>
          <Disclaimer levels={false} />
          <PhotoCredits />
        </>
      ) : (
        <div className="flex min-h-80 flex-1 flex-col items-center justify-center">
          <ComingSoon title="TickQuest is coming soon" icon={Compass}>
            Collect every tick you catch with Scan.
          </ComingSoon>
        </div>
      )}
    </Page>
  );
}
