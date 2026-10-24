"use client";

import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from "react";
import type { Source } from "@/lib/types";

// Citations, collected per page: modules call useCite(sources) instead of drawing their own lists, and
// <SourcesFooter /> shows every source once, as one line of small links at the bottom (next to the disclaimer).
const Register = createContext<((id: string, sources: Source[] | null) => void) | null>(null);
const Collected = createContext<Source[]>([]);

export function SourcesProvider({ children }: { children: ReactNode }) {
  const [byModule, setByModule] = useState<Map<string, Source[]>>(() => new Map());
  const register = useCallback((id: string, sources: Source[] | null) => {
    setByModule((prev) => {
      const next = new Map(prev);
      if (sources) next.set(id, sources);
      else next.delete(id);
      return next;
    });
  }, []);
  const all = [...byModule.values()].flat();
  const unique = all.filter((s, i) => all.findIndex((o) => o.url === s.url) === i);

  return (
    <Register.Provider value={register}>
      <Collected.Provider value={unique}>{children}</Collected.Provider>
    </Register.Provider>
  );
}

// Adds these sources to the page's footer while the calling component is on screen.
export function useCite(sources: Source[] | undefined) {
  const register = useContext(Register);
  const id = useId();
  const key = sources?.map((s) => s.url).join(" ") ?? "";
  useEffect(() => {
    if (!register || !sources?.length) return;
    register(id, sources);
    return () => register(id, null);
    // `key` stands for `sources`: a new array with the same links shouldn't re-register.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, id, key]);
}

export function SourcesFooter() {
  const sources = useContext(Collected);
  if (!sources.length) return null;
  return (
    <p className="px-1 type-footnote text-muted-foreground">
      Sources:{" "}
      {sources.map((s, i) => (
        <span key={s.url}>
          <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-separator underline-offset-2 hover:text-foreground">
            {s.name}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {i < sources.length - 1 && " · "}
        </span>
      ))}
    </p>
  );
}
