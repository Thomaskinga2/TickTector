import Link from "next/link";
import { Page } from "@/components/page";
import { ComingSoon } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";

// A dead end: Tick, puzzled, in the same meadow card as the screens that aren't built yet.
export default function NotFound() {
  return (
    <Page title="Not found">
      <div className="flex min-h-80 flex-1 flex-col justify-center">
        <ComingSoon
          title="This trail goes cold"
          puzzled
          action={
            <Link href="/" className={buttonVariants({ variant: "tinted", className: "mt-1" })}>
              Find your town
            </Link>
          }
        >
          We couldn&apos;t find that page. Try your town instead.
        </ComingSoon>
      </div>
    </Page>
  );
}
