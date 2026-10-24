import Image from "next/image";
import { TickArt } from "@/components/tick-art";
import type { TickStage, TickdexCatch } from "@/lib/tickdex";
import { standInNote, tickPhoto, tickPhotoSrc } from "@/lib/tick-photos";
import { cn } from "@/lib/utils";

type TickPhotoProps = {
  speciesId: string;
  stage: TickStage;
  width: number;
  height: number;
  engorgement?: TickdexCatch["engorgement"]; // only used by the drawn fallback
  className?: string;
};

// A real photo of this species and stage (lib/tick-photos.ts); the drawn TickArt when there is none (unknown species).
export function TickPhoto({ speciesId, stage, width, height, engorgement, className }: TickPhotoProps) {
  const photo = tickPhoto(speciesId, stage);
  if (!photo) return <TickArt speciesId={speciesId} stage={stage} engorgement={engorgement} className={cn("h-full w-full", className)} />;
  return (
    <Image
      src={tickPhotoSrc(photo)}
      alt={photo.alt}
      width={width}
      height={height}
      sizes={`${width}px`}
      className={cn("h-full w-full object-cover object-center", className)}
    />
  );
}

// "Photo: <author>, <licence>", linking to the file page; nothing when the slot has no photo.
export function TickPhotoCredit({ speciesId, stage, className }: { speciesId: string; stage: TickStage; className?: string }) {
  const photo = tickPhoto(speciesId, stage);
  if (!photo) return null;
  const note = standInNote(photo);
  return (
    <p className={cn("text-[12px] text-muted-foreground", className)}>
      <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
        Photo: {photo.author}, {photo.licence}
      </a>
      {note && <span> {note}</span>}
    </p>
  );
}
