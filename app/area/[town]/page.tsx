import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Page } from "@/components/page";
import { LoadingState } from "@/components/states";
import { findTown } from "@/lib/providers/risk";
import { AreaView } from "./area-view";

// A shared town link previews with the town's name (the image is the app's Open Graph card).
export async function generateMetadata({ params }: PageProps<"/area/[town]">): Promise<Metadata> {
  const town = findTown((await params).town);
  if (!town) return {};
  const title = `${town.name} tick risk this week · TickTector`;
  const description = `This week's tick risk for ${town.name}, Massachusetts, from Mass. DPH data and the National Weather Service forecast.`;
  return { title, description, openGraph: { title, description } };
}

// The town param is only known at request time, so it must be read inside Suspense (Cache Components).
export default function AreaPage({ params }: PageProps<"/area/[town]">) {
  return (
    <Suspense
      fallback={
        <Page hero back={{ href: "/", label: "Towns" }}>
          <LoadingState />
        </Page>
      }
    >
      <AreaContent params={params} />
    </Suspense>
  );
}

async function AreaContent({ params }: Pick<PageProps<"/area/[town]">, "params">) {
  const { town } = await params;
  // Only the 351 Massachusetts cities and towns have pages.
  if (!findTown(town)) notFound();
  return <AreaView townId={town} />;
}
