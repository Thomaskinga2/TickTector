import { Suspense } from "react";
import { Page } from "@/components/page";
import { LoadingState } from "@/components/states";
import { AreaView } from "./area-view";

// The town param is only known at request time, so it must be read inside Suspense (Cache Components).
export default function AreaPage({ params }: PageProps<"/area/[town]">) {
  return (
    <Suspense fallback={<Page><LoadingState /></Page>}>
      <AreaContent params={params} />
    </Suspense>
  );
}

async function AreaContent({ params }: Pick<PageProps<"/area/[town]">, "params">) {
  const { town } = await params;
  return <AreaView townId={town} />;
}
