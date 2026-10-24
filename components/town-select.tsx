"use client";

import { searchTowns } from "@/lib/services/towns";
import type { Town } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

// Native <select> of MA towns. allLabel adds an empty "all towns" option (for filters).
export function TownSelect({
  id,
  value,
  onChange,
  allLabel,
}: {
  id: string;
  value: string;
  onChange: (townId: string, town: Town | undefined) => void;
  allLabel?: string;
}) {
  // TODO: searchTowns("") returns every mock town; switch to a dedicated town list once real data lands.
  const { data: towns, loading, error } = useAsync(() => searchTowns(""), []);

  return (
    <select
      id={id}
      value={value}
      disabled={loading || !!error}
      onChange={(e) => onChange(e.target.value, towns?.find((t) => t.id === e.target.value))}
      className="h-12 w-full rounded-lg border bg-card px-3 text-base"
    >
      {allLabel !== undefined ? <option value="">{allLabel}</option> : <option value="" disabled>{loading ? "Loading towns…" : "Choose a town"}</option>}
      {towns?.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
