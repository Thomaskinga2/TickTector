// TODO: TikQuest, a location-based exploration game (like a GPS exploration game).
// Players walk to real places in their town, find virtual "tick hotspots", and earn badges
// by answering questions about ticks and prevention. Needs geolocation, a map, and the camera.

import { Page } from "@/components/page";
import { ComingSoon } from "@/components/states";
import { features } from "@/lib/features";

export default function QuestPage() {
  return (
    <Page title="TikQuest">
      {/* Full-height container reserved for the future map/camera game view. */}
      <div className="flex min-h-80 flex-1 flex-col items-center justify-center">
        {!features.quest && <ComingSoon title="TikQuest">Explore your town and learn how to stay safe from ticks. Coming soon.</ComingSoon>}
      </div>
    </Page>
  );
}
