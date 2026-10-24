"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Shuffle } from "lucide-react";
import { useCite } from "@/components/sources";
import { slotStatus } from "@/components/states";
import { Button } from "@/components/ui/button";
import { swap } from "@/lib/motion";
import { getFacts } from "@/lib/services/facts";
import { useAsync } from "@/lib/use-async";

// "Did you know?": one cited fact at a time. Today's fact is picked by the device's date, so it changes daily;
// "Another fact" steps through the rest.
export function FunFacts() {
  const { data: facts, ...slot } = useAsync(() => getFacts(), []);
  const [step, setStep] = useState(0);
  const now = new Date();
  const today = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
  const fact = facts?.length ? facts[(today + step) % facts.length] : undefined;
  useCite(fact && [fact.source]);
  const status = slotStatus(slot, !fact, "No facts to show right now.");
  if (status || !fact) return status;

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={fact.id} {...swap} aria-live="polite" className="flex flex-col gap-2">
          <p className="type-body">{fact.text}</p>
        </m.div>
      </AnimatePresence>
      <Button variant="gray" size="sm" className="self-start" onClick={() => setStep((n) => n + 1)}>
        <Shuffle className="size-4" strokeWidth={2.6} aria-hidden />
        Another fact
      </Button>
    </div>
  );
}
