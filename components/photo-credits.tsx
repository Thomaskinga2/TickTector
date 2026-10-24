import { standInNote, TICK_PHOTOS } from "@/lib/tick-photos";

// Every tick photo's title, author, licence and source, as small print at the very bottom of Quest.
export function PhotoCredits() {
  return (
    <section aria-labelledby="photo-credits" className="flex flex-col gap-1 px-1 type-caption1 text-muted-foreground">
      <h2 id="photo-credits" className="font-semibold">
        Photo credits
      </h2>
      <ul className="flex flex-col gap-1">
        {TICK_PHOTOS.map((p) => (
          <li key={`${p.speciesId}-${p.stage}`} className="break-words">
            {/* Capitalized here: CSS ::first-letter only works on block boxes, and this runs inline. */}
            {sentenceCase(p.speciesId.replace(/-/g, " "))}, {p.stage}
            {standInNote(p) && <> {standInNote(p)}</>}: “{p.title.replace(/\.\w+$/, "")}” by {p.author},{" "}
            <a href={p.licenceUrl} target="_blank" rel="noreferrer" className="underline decoration-separator underline-offset-2 hover:text-foreground">
              {p.licence}
            </a>
            {" · "}
            <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-separator underline-offset-2 hover:text-foreground">
              source
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

const sentenceCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
