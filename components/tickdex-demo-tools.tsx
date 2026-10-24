"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addCatch, clearCatches } from "@/lib/tickdex";
import { SAMPLE_CATCHES } from "@/lib/tickdex-slots";

const DISARM_AFTER_MS = 4000;

// Shown only with ?demo=1: fill the dex with sample (bean) catches, or erase it with a two-tap reset.
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
    <section aria-label="Demo tools" className="flex flex-col gap-3 rounded-2xl border-2 border-dashed p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <FlaskConical className="size-4 text-primary" aria-hidden />
        Demo tools
      </p>
      <p className="text-sm text-muted-foreground">Sample catches are marked “Demo: bean” and have no photo.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="h-11 px-4" onClick={() => SAMPLE_CATCHES.forEach((c) => addCatch(c))}>
          Add sample catches
        </Button>
        <Button
          variant={isArmed ? "destructive" : "ghost"}
          className="h-11 px-4"
          onClick={reset}
          disabled={catchCount === 0 && !isArmed}
          aria-live="polite"
        >
          <Trash2 aria-hidden />
          {isArmed ? `Tap again to erase ${catchCount} ${catchCount === 1 ? "catch" : "catches"}` : "Reset Tickdex"}
        </Button>
      </div>
    </section>
  );
}
