"use client";

import { Phone } from "lucide-react";
import { useState } from "react";
import type { TickdexCatch } from "@/lib/tickdex";
import { CARE_STEPS, callDoctorSoon, PREVENTIVE_WINDOW_HOURS, speciesCare, WATCH_DAYS, watchUntil } from "@/lib/tick-aftercare";

// What to do about a bite from this tick: steps, what to watch for, when to see a doctor.
// With a catch (the newest in the slot) it also dates the watch window and flags the preventive-antibiotic window.
export function TickAftercare({ speciesId, latest }: { speciesId: string; latest?: TickdexCatch }) {
  const care = speciesCare(speciesId);
  const [now] = useState(() => new Date()); // read once when the sheet opens
  const until = latest ? watchUntil(latest) : null;
  const isWatching = until !== null && until > now;

  return (
    <section aria-labelledby="aftercare-title" className="flex flex-col gap-3 rounded-2xl border-2 border-tickdex-gold/60 bg-card p-4">
      <h3 id="aftercare-title" className="font-tickdex text-[17px]">
        Bite aftercare
      </h3>

      {latest && callDoctorSoon(latest, now) && (
        <p className="flex gap-2 rounded-xl bg-risk-high/12 p-3 text-[14px] font-semibold text-risk-high">
          <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
          This deer tick looked fed. Call a doctor within {PREVENTIVE_WINDOW_HOURS} hours of removing it about a preventive antibiotic.
        </p>
      )}

      <ol className="flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-snug marker:font-semibold">
        {CARE_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className="flex flex-col gap-1.5 rounded-xl bg-muted/70 p-3">
        <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
          {isWatching && until ? `Watch until ${until.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : `Watch for ${WATCH_DAYS} days after a bite`}
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-[14px] leading-snug">
          {care.watchFor.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>
        <p className="text-[14px] font-semibold">See a doctor if any of these appear, and say you had a tick bite.</p>
      </div>

      {care.note && <p className="text-[14px] leading-snug text-muted-foreground">{care.note}</p>}
    </section>
  );
}
