"use client";

import { useId, useState } from "react";
import { Search, X } from "lucide-react";
import { LevelFace } from "@/components/level-face";
import { matchTowns } from "@/components/map-utils";
import { RISK_LABEL } from "@/components/risk-badge";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

// The Risk Map's search: type a town, pick it, and the map goes there. Same field as Home's search; the results
// float over the map below it. A combobox: Up/Down move through results, Return picks, Escape clears.
export function MapTownSearch({ levelOf, onPick }: { levelOf: (townId: string) => RiskLevel | undefined; onPick: (townId: string) => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const id = useId();
  const results = matchTowns(query);
  const open = query.trim().length > 0;
  const optionId = (i: number) => `${id}-option-${i}`;

  const pick = (townId: string) => {
    onPick(townId);
    setQuery("");
    // Hide the phone keyboard so the map and the town's card are in view.
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <div role="search" className="relative">
      <label htmlFor={`${id}-input`} className="sr-only">
        Find a city or town on the map
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" strokeWidth={2.4} aria-hidden />
      <input
        id={`${id}-input`}
        type="search"
        inputMode="search"
        enterKeyHint="go"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && results.length ? optionId(active) : undefined}
        placeholder="Find a town on the map"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (results.length) setActive((i) => (i + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (results[active]) pick(results[active].id);
          } else if (e.key === "Escape") {
            setQuery("");
          }
        }}
        className="h-11 w-full text-ellipsis rounded-full bg-fill pr-11 pl-10 type-body outline-none placeholder-shown:pr-4 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground"
        >
          <X className="size-[18px]" strokeWidth={2.4} aria-hidden />
        </button>
      )}

      {open && (
        // Floats over the map: the map frame isolates Leaflet's layers, so a small z-index clears them and stays
        // under the tab bar.
        <div className="soft-block absolute inset-x-0 top-full z-30 mt-2 overflow-hidden">
          {results.length ? (
            <ul id={`${id}-list`} role="listbox" aria-label="Matching cities and towns">
              {results.map((town, i) => {
                const level = levelOf(town.id);
                return (
                  <li
                    key={town.id}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === active}
                    // Pick on click, never on pointer down: picking on press closed the list under the finger, and on
                    // a phone the tap's click then landed on what was beneath it (a level filter, which hid the town).
                    // The list stays open on blur, so the click still reaches the row.
                    onClick={() => pick(town.id)}
                    onPointerEnter={() => setActive(i)}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2",
                      i > 0 && "border-t border-separator",
                      i === active && "bg-fill",
                    )}
                  >
                    {level && <LevelFace level={level} size={26} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate type-body">{town.name}</span>
                      <span className="block truncate type-footnote text-muted-foreground">{town.county} County</span>
                    </span>
                    {level && <span className="shrink-0 type-subhead text-muted-foreground">{RISK_LABEL[level]} risk</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p id={`${id}-list`} role="status" className="px-4 py-3 type-subhead text-muted-foreground">
              No Massachusetts city or town matches “{query.trim()}”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
