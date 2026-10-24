"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domMax } from "motion/react";
import { smooth } from "@/lib/motion";

// Motion for the whole app: features load lazily (smaller bundle on phones), `m.*` components only,
// one default spring, and the phone's Reduce Motion setting respected.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={smooth}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
