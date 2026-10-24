import { Logo } from "@/components/logo";
import { Page } from "@/components/page";
import { SourcesProvider } from "@/components/sources";
import { TownBrowser } from "@/components/town-browser";

export default function Home() {
  return (
    <SourcesProvider>
      <Page title={<Logo />} className="gap-4">
        <p className="-mt-3 px-0.5 type-subhead text-muted-foreground">This week&apos;s tick risk for Massachusetts towns.</p>
        <TownBrowser />
      </Page>
    </SourcesProvider>
  );
}
