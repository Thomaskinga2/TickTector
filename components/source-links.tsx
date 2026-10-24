import { ArrowUpRight } from "lucide-react";
import type { Source } from "@/lib/types";

// A citation link that opens the source in a new tab. A full 44pt row, so it's easy to tap on a phone.
export function SourceLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-0.5 self-start type-footnote font-semibold text-foreground underline-offset-2 hover:underline">
      {children}
      <ArrowUpRight className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

// "Sources" under a module: every page the content above was taken from.
export function SourceList({ sources }: { sources: Source[] }) {
  const unique = sources.filter((s, i) => sources.findIndex((o) => o.url === s.url) === i);
  return (
    <div className="flex flex-col gap-1 border-t border-separator pt-3">
      <p className="type-footnote text-muted-foreground">Sources</p>
      <ul className="flex flex-col">
        {unique.map((s) => (
          <li key={s.url}>
            <SourceLink href={s.url}>{s.name}</SourceLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
