"use client";

import type { ComponentType, ReactNode } from "react";
import * as m from "motion/react-m";
import { revealOnScroll } from "@/lib/motion";

// A module on the town page: a soft block with a round symbol and a title, then its content.
type Icon = ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;

export function TownModule({ icon: Icon, title, children }: { icon: Icon; title: string; children: ReactNode }) {
  return (
    // Rises in the first time it scrolls into view.
    <m.section {...revealOnScroll} className="soft-block px-4 pt-3.5 pb-4">
      <h2 className="flex items-center gap-2.5 type-headline">
        <span className="module-icon">
          <Icon className="size-[18px]" strokeWidth={2.2} aria-hidden />
        </span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </m.section>
  );
}
