// Real deer tick photos for the life-cycle diagram's stage nodes, loaded before the first frame like the fonts.
// Stand-ins are skipped (an adult photo on the larva node would teach the wrong thing): those nodes stay drawn,
// as does any node whose photo failed to load.
import type { TickStage } from "@/lib/tickdex";
import { TICK_PHOTOS, tickPhotoSrc } from "@/lib/tick-photos";

const DIAGRAM_SPECIES = "deer-tick";
const PHOTO_WAIT_MS = 3000;

const loaded = new Map<TickStage, HTMLImageElement>();
let loading: Promise<void> | null = null;

function loadOne(stage: TickStage, src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      loaded.set(stage, img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function loadNodePhotos(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const wanted = TICK_PHOTOS.filter((p) => p.speciesId === DIAGRAM_SPECIES && !p.standIn);
  loading ??= Promise.race([
    Promise.all(wanted.map((p) => loadOne(p.stage, tickPhotoSrc(p)))).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, PHOTO_WAIT_MS)),
  ]);
  return loading;
}

export function nodePhoto(stage: TickStage): HTMLImageElement | undefined {
  return loaded.get(stage);
}
