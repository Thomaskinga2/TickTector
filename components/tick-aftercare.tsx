"use client";

import { HeartPulse, Phone } from "lucide-react";
import { useState } from "react";
import { useCite } from "@/components/sources";
import type { TickdexCatch } from "@/lib/tickdex";
import { CARE_STEPS, callDoctorSoon, PREVENTIVE_WINDOW_HOURS, speciesCare, WATCH_DAYS, watchUntil } from "@/lib/tick-aftercare";

const CDC_AFTER_BITE = { name: "CDC: What to do after a tick bite", url: "https://www.cdc.gov/ticks/after-a-tick-bite/index.html" };

// What to do about a bite from this tick: steps, what to watch for, when to see a doctor.
// With a catch (the newest in the slot) it also dates the watch window and flags the preventive-antibiotic window.
export function TickAftercare({ speciesId, latest }: { speciesId: string; latest?: TickdexCatch }) {
  const care = speciesCare(speciesId);
  const [now] = useState(() => new Date()); // read once when the sheet opens
  const until = latest ? watchUntil(latest) : null;
  const isWatching = until !== null && until > now;
  useCite([CDC_AFTER_BITE]);

  return (
    <section aria-labelledby="aftercare-title" className="soft-block flex flex-col gap-3 px-4 pt-3.5 pb-4">
      <h3 id="aftercare-title" className="flex items-center gap-2.5 type-headline">
        <span className="module-icon">
          <HeartPulse className="size-[18px]" strokeWidth={2.2} aria-hidden />
        </span>
        After a bite
      </h3>

      {latest && callDoctorSoon(latest, now) && (
        // An urgent health note, so the system red, not a level color.
        <p className="flex gap-2 rounded-[14px] bg-[color-mix(in_oklab,var(--system-red)_10%,transparent)] p-3 type-subhead font-semibold text-destructive">
          <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
          This deer tick looked fed. Call a doctor within {PREVENTIVE_WINDOW_HOURS} hours of removing it about a preventive antibiotic.
        </p>
      )}

      <ol className="flex list-decimal flex-col gap-2 pl-5 type-subhead marker:font-semibold marker:text-muted-foreground">
        {CARE_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className="flex flex-col gap-1.5 rounded-[14px] bg-fill p-3">
        <p className="type-footnote font-semibold text-muted-foreground">
          {isWatching && until ? `Watch until ${until.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : `Watch for ${WATCH_DAYS} days after a bite`}
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-5 type-subhead">
          {care.watchFor.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>
        <p className="type-subhead font-semibold">See a doctor if any of these appear, and say you had a tick bite.</p>
      </div>

      {care.note && <p className="type-subhead text-muted-foreground">{care.note}</p>}
    </section>
  );
}
