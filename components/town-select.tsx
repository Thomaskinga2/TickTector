"use client";

import { ChevronsUpDown } from "lucide-react";
import { searchTowns } from "@/lib/services/towns";
import type { Town } from "@/lib/types";
import { useAsync } from "@/lib/use-async";
import { cn } from "@/lib/utils";

// Native <select> of MA towns (iOS shows its own picker). allLabel adds an empty "all towns" option (for filters).
// `appearance="menu"` styles it as an iOS pull-down button; the default fills a form row.
export function TownSelect({
  id,
  value,
  onChange,
  allLabel,
  appearance = "row",
}: {
  id: string;
  value: string;
  onChange: (townId: string, town: Town | undefined) => void;
  allLabel?: string;
  appearance?: "row" | "menu";
}) {
  // TODO: searchTowns("") returns every mock town; switch to a dedicated town list once real data lands.
  const { data: towns, loading, error } = useAsync(() => searchTowns(""), []);
  const sorted = towns && [...towns].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <span className="relative inline-flex w-full items-center">
      <select
        id={id}
        value={value}
        disabled={loading || !!error}
        onChange={(e) => onChange(e.target.value, towns?.find((t) => t.id === e.target.value))}
        className={cn(
          "w-full appearance-none bg-transparent outline-none",
          appearance === "menu" ? "h-11 rounded-full bg-fill pr-9 pl-4 type-body font-medium text-primary" : "h-11 pr-8 type-body",
        )}
      >
        {allLabel !== undefined ? (
          <option value="">{allLabel}</option>
        ) : (
          <option value="" disabled>
            {loading ? "Loading towns…" : "Choose a town"}
          </option>
        )}
        {sorted?.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <ChevronsUpDown
        className={cn("pointer-events-none absolute size-4", appearance === "menu" ? "right-3.5 text-primary" : "right-1 text-muted-foreground")}
        aria-hidden
      />
    </span>
  );
}
