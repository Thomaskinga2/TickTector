import { Page } from "@/components/page";
import { MessagesSquare } from "lucide-react";
import { ComingSoon } from "@/components/states";
import { features } from "@/lib/features";

export default function ForumLayout({ children }: LayoutProps<"/forum">) {
  if (!features.forum) {
    return (
      <Page title="Sightings">
        <ComingSoon title="Sightings are coming soon" icon={MessagesSquare}>
          Share where you found ticks with your neighbors.
        </ComingSoon>
      </Page>
    );
  }
  return children;
}
