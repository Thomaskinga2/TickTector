"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { slotStatus } from "@/components/states";
import { searchTowns } from "@/lib/services/towns";
import type { Town } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

export const TOWN_SEARCH_ID = "town-search";

export function TownSearch({ onSelect }: { onSelect: (town: Town) => void }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: towns, ...slot } = useAsync(
    () => (debounced ? searchTowns(debounced) : Promise.resolve(null)),
    [debounced],
  );

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={TOWN_SEARCH_ID} className="font-medium">
        Find your town
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id={TOWN_SEARCH_ID}
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Amherst, Boston, Worcester…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-lg border bg-card pr-3 pl-10 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      {debounced && (slotStatus(slot, !towns?.length, `No Massachusetts town matches "${debounced}".`) ?? (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {towns?.map((town) => (
            <li key={town.id}>
              <button
                type="button"
                onClick={() => onSelect(town)}
                className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left"
              >
                <span>
                  {town.name}
                  <span className="block text-sm text-muted-foreground">{town.county} County</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
