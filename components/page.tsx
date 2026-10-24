"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Back = { href: string; label: string };

// An iOS screen with a bar of glass buttons on top. Nothing in the bar appears or disappears as you scroll:
// - Screens with their own big title (a large title, or a `hero` such as the town page): the bar is just its glass
//   buttons, with no title and no backdrop; the title scrolls away with the content.
// - Screens without one (a post): the bar shows the title on its frosted edge from the start.
export function Page({
  title,
  titleAccessory,
  back,
  leading,
  trailing,
  largeTitle = true,
  hero = false,
  inSheet = false,
  className,
  children,
}: {
  title?: ReactNode;
  // Sits beside the large title only (Home's mascot); never in the compact bar.
  titleAccessory?: ReactNode;
  back?: Back;
  leading?: ReactNode;
  trailing?: ReactNode;
  largeTitle?: boolean;
  hero?: boolean;
  // Inside a sheet the bar sits below the status bar already, so it skips the safe-area inset.
  inSheet?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const showsLargeTitle = largeTitle && !hero && title;
  const ownsTitle = !!showsLargeTitle || hero;

  return (
    <>
      <header
        // The frosted edge, on from the start, only behind a bar that carries the title.
        data-scrolled={ownsTitle ? undefined : true}
        className={cn(
          "sticky top-0 z-40",
          ownsTitle ? "pointer-events-none [&_a,&_button]:pointer-events-auto" : "scroll-edge",
          // Below the status bar on an iPhone; where there's no inset (desktop, Android, Safari with its bar on
          // top) the bar buttons still get a little room instead of touching the top edge.
          !inSheet && (hero ? "pt-[max(env(safe-area-inset-top),1.25rem)]" : "pt-[max(env(safe-area-inset-top),0.75rem)]"),
        )}
      >
        <div
          className={cn(
            "mx-auto grid h-11 w-full max-w-xl grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)] items-center gap-2",
            // Hero: the buttons sit 6 pt inside the hero card's corners (16 pt page margin + 6).
            hero ? "px-[22px]" : "px-4",
          )}
        >
          <div className="flex justify-start">
            {leading ?? (back && <BackButton back={back} />)}
          </div>
          {ownsTitle ? <span /> : <h1 className="truncate text-center type-headline">{title}</h1>}
          <div className="flex justify-end gap-2">{trailing}</div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pt-1 pb-6",
          // The hero card starts behind the bar, its top 6 pt above the buttons (44 pt bar + 4 pt padding + 6), so
          // the bar buttons sit inside its corners. 6 pt is the gap that makes a 22 pt-radius button concentric
          // with the card's 28 pt corner, as iOS does; before, they hovered 4 pt above the card's edge.
          hero && "[&_[data-page-hero]]:-mt-[54px]",
          className,
        )}
      >
        {showsLargeTitle && (
          <div className="flex items-end justify-between gap-3">
            <h1 data-large-title className="type-large-title font-bold">
              {title}
            </h1>
            {titleAccessory}
          </div>
        )}
        {children}
      </main>
    </>
  );
}

// HIG: the standard back symbol with no "Back" text; the destination is announced to assistive tech.
function BackButton({ back }: { back: Back }) {
  return (
    <Link
      href={back.href}
      aria-label={`Back to ${back.label}`}
      className="pressable glass grid size-11 place-items-center rounded-full text-foreground"
    >
      <ChevronLeft className="size-6" strokeWidth={2.2} aria-hidden />
    </Link>
  );
}

// A grouped section with a Title 3 header, as in Health and Fitness.
export function Section({ title, footer, children }: { title?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title && <h2 className="px-1 type-title3 font-semibold">{title}</h2>}
      {children}
      {footer && <div className="px-4 type-footnote text-muted-foreground">{footer}</div>}
    </section>
  );
}
