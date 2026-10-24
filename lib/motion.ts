import type { Transition, Variants } from "motion/react";

// TickTector's motion vocabulary (Motion, motion.dev). Every animation in the app picks from these.

// Apple's default: a spring with no bounce (SwiftUI .smooth). Layout, fades, sheets, lists.
export const smooth: Transition = { type: "spring", duration: 0.5, bounce: 0 };
// A little bounce for things you touch and for Tick.
export const springy: Transition = { type: "spring", duration: 0.45, bounce: 0.32 };

// Lists settle in one after another: short steps, a small rise, nothing slides far.
export const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};
export const rise: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: smooth },
};

// Content that rises in the first time it scrolls into view (town page modules).
export const revealOnScroll = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px -40px 0px" },
  transition: smooth,
} as const;

// Views swapped in place (Home's counties / a county's towns / search results).
export const swap = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: smooth },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
} as const;
