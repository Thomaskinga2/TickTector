import { Page } from "@/components/page";
import { ComingSoon } from "@/components/states";
import { features } from "@/lib/features";

export default function ForumLayout({ children }: LayoutProps<"/forum">) {
  if (!features.forum) {
    return (
      <Page title="Tick sightings">
        <ComingSoon title="Forum">Sharing tick sightings is coming soon.</ComingSoon>
      </Page>
    );
  }
  return children;
}
