"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Tick } from "@/components/tick";
import { springy } from "@/lib/motion";

// Tiny confirmations ("Posted", "Link copied"): a glass capsule with Tick that drops in at the top and leaves
// on its own. Call toast("…") from anywhere on the client; <Toaster /> lives once in the root layout.
type Message = { id: number; text: string };
let current: Message | null = null;
const listeners = new Set<() => void>();

export function toast(text: string) {
  current = { id: Date.now(), text };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

const SHOW_MS = 2600;

export function Toaster() {
  const message = useSyncExternalStore(subscribe, () => current, () => null);
  const [dismissed, setDismissed] = useState<number | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setDismissed(message.id), SHOW_MS);
    return () => clearTimeout(timer);
  }, [message]);
  const visible = message && message.id !== dismissed ? message : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[60] flex justify-center px-4"
    >
      <AnimatePresence>
        {visible && (
          <m.div
            key={visible.id}
            initial={{ opacity: 0, y: -18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97, transition: { duration: 0.18 } }}
            transition={springy}
            className="glass flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 type-subhead font-semibold"
          >
            <Tick size={28} />
            {visible.text}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
