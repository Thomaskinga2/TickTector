import { standInNote, TICK_PHOTOS } from "@/lib/tick-photos";

// Every tick photo's title, author, licence and source, collapsed at the bottom of /quest.
export function PhotoCredits() {
  return (
    <details className="mt-6 rounded-2xl border bg-card p-4 text-[13px]">
      <summary className="cursor-pointer font-semibold">Photo credits</summary>
      <ul className="mt-3 flex flex-col gap-3">
        {TICK_PHOTOS.map((p) => (
          <li key={p.file} className="flex flex-col">
            <span className="font-medium">
              {p.speciesId.replace(/-/g, " ")}, {p.stage} {standInNote(p) && <span className="text-muted-foreground">{standInNote(p)}</span>}
            </span>
            <span className="break-words text-muted-foreground">
              “{p.title.replace(/\.\w+$/, "")}” by {p.author},{" "}
              <a href={p.licenceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                {p.licence}
              </a>
              {" · "}
              <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                source
              </a>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
