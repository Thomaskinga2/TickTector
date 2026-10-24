"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";
import { smooth } from "@/lib/motion";

// Motion's features (animation, layout, drag) arrive in their own chunk after first paint instead of in every
// page's startup JavaScript (about 60 KB less to parse up front on a phone); animations start once it lands.
const loadFeatures = () => import("@/lib/motion-features").then((m) => m.default);

// Motion for the whole app: features load lazily (smaller bundle on phones), `m.*` components only,
// one default spring, and the phone's Reduce Motion setting respected.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={smooth}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
