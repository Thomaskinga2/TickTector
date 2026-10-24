"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addCatch, clearCatches } from "@/lib/tickdex";
import { SAMPLE_CATCHES } from "@/lib/tickdex-slots";

const DISARM_AFTER_MS = 4000;

// Shown only with ?demo=1: fill the dex with sample catches, or erase it with a two-tap reset.
export function TickdexDemoTools({ catchCount }: { catchCount: number }) {
  const [isArmed, setIsArmed] = useState(false);

  useEffect(() => {
    if (!isArmed) return;
    const timer = window.setTimeout(() => setIsArmed(false), DISARM_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [isArmed]);

  const reset = () => {
    if (!isArmed) {
      setIsArmed(true);
      return;
    }
    clearCatches();
    setIsArmed(false);
  };

  return (
    <section aria-labelledby="demo-tools-title" className="soft-block flex flex-col gap-3 px-4 pt-3.5 pb-4">
      <h2 id="demo-tools-title" className="flex items-center gap-2.5 type-headline">
        <span className="module-icon">
          <FlaskConical className="size-[18px]" strokeWidth={2.2} aria-hidden />
        </span>
        Demo tools
      </h2>
      <p className="type-subhead text-muted-foreground">Sample catches are marked “Demo” and have no photo.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="gray" onClick={() => SAMPLE_CATCHES.forEach((c) => addCatch(c))}>
          Add sample catches
        </Button>
        <Button variant={isArmed ? "destructive" : "plain"} onClick={reset} disabled={catchCount === 0 && !isArmed} aria-live="polite">
          <Trash2 aria-hidden />
          {isArmed ? `Tap again to erase ${catchCount} ${catchCount === 1 ? "catch" : "catches"}` : "Reset Tickdex"}
        </Button>
      </div>
    </section>
  );
}
