// Real tick photos (public/ticks/) with their licences, copied from reference/tick-photos/credits.json.
// Public domain, CC BY or CC BY-SA only; CC BY-SA needs the licence link wherever the photo is credited.
// standIn: no usable photo of that stage was found, so the slot shows another stage of the same species.
import type { TickStage } from "@/lib/tickdex";

export type TickPhotoCredit = {
  file: string;
  speciesId: string;
  stage: TickStage;
  title: string;
  author: string;
  licence: string;
  licenceUrl: string;
  sourceUrl: string;
  standIn: boolean;
  alt: string;
};

export const TICK_PHOTOS: readonly TickPhotoCredit[] = [
  {
    file: "deer-tick-larva.jpg",
    speciesId: "deer-tick",
    stage: "larva",
    title: "Deer tick insect ixodes scapularis.jpg",
    author: "Scott Bauer, USDA ARS",
    licence: "Public domain",
    licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Deer_tick_insect_ixodes_scapularis.jpg",
    standIn: true,
    alt: "An adult female deer tick with a black shield and red-brown body on a green leaf.",
  },
  {
    file: "deer-tick-nymph.jpg",
    speciesId: "deer-tick",
    stage: "nymph",
    title: "Deer tick insect ixodes scapularis.jpg",
    author: "Scott Bauer, USDA ARS",
    licence: "Public domain",
    licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Deer_tick_insect_ixodes_scapularis.jpg",
    standIn: true,
    alt: "An adult female deer tick with a black shield and red-brown body on a green leaf.",
  },
  {
    file: "deer-tick-adult.jpg",
    speciesId: "deer-tick",
    stage: "adult",
    title: "Adult deer tick(cropped).jpg",
    author: "Scott Bauer, USDA ARS",
    licence: "Public domain",
    licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Adult_deer_tick(cropped).jpg",
    standIn: false,
    alt: "A close-up of an adult female deer tick, black legs and shield over a red-brown body, on a leaf.",
  },
  {
    file: "dog-tick-larva.jpg",
    speciesId: "dog-tick",
    stage: "larva",
    title: "American Dog Tick - Dermacentor variabilis, Mattaponi Bluffs Wildlife Management Area, Milford, Virginia, July 5, 2023 (53321783352).jpg",
    author: "Judy Gallagher",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:American_Dog_Tick_-_Dermacentor_variabilis,_Mattaponi_Bluffs_Wildlife_Management_Area,_Milford,_Virginia,_July_5,_2023_(53321783352).jpg",
    standIn: true,
    alt: "An adult American dog tick with a pale mottled shield crawling on a fibrous mat.",
  },
  {
    file: "dog-tick-nymph.jpg",
    speciesId: "dog-tick",
    stage: "nymph",
    title: "American Dog Tick (Dermacentor variabilis) (14447132844).jpg",
    author: "Benjamin Smith",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:American_Dog_Tick_(Dermacentor_variabilis)_(14447132844).jpg",
    standIn: true,
    alt: "An adult American dog tick seen from above against a black background.",
  },
  {
    file: "dog-tick-adult.jpg",
    speciesId: "dog-tick",
    stage: "adult",
    title: "Dermacentor variabilis-female.jpg",
    author: "Peterwchen",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Dermacentor_variabilis-female.jpg",
    standIn: false,
    alt: "An adult female American dog tick with a cream-patterned shield crawling on skin.",
  },
  {
    file: "lone-star-tick-larva.jpg",
    speciesId: "lone-star-tick",
    stage: "larva",
    title: "Lone-star-tick-stages-cdc.jpg",
    author: "CDC",
    licence: "Public domain",
    licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Lone-star-tick-stages-cdc.jpg",
    standIn: false,
    alt: "A magnified six-legged lone star tick larva, pale yellow, on a black background.",
  },
  {
    file: "lone-star-tick-nymph.jpg",
    speciesId: "lone-star-tick",
    stage: "nymph",
    title: "Lone-star-tick-stages-cdc.jpg",
    author: "CDC",
    licence: "Public domain",
    licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Lone-star-tick-stages-cdc.jpg",
    standIn: false,
    alt: "A lone star tick nymph, small and orange-brown, seen from above on black.",
  },
  {
    file: "lone-star-tick-adult.jpg",
    speciesId: "lone-star-tick",
    stage: "adult",
    title: "Amblyomma americanum tick 2.jpg",
    author: "James Gathany, CDC",
    licence: "Public domain",
    licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Amblyomma_americanum_tick_2.jpg",
    standIn: false,
    alt: "An adult female lone star tick with a single white spot on its back, on a green leaf.",
  },
  {
    file: "woodchuck-tick.jpg",
    speciesId: "woodchuck-tick",
    stage: "larva",
    title: "Ixodes cookei.jpg",
    author: "adamfritz (iNaturalist Canada)",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ixodes_cookei.jpg",
    standIn: true,
    alt: "An adult female woodchuck tick after feeding: dark red-brown shield and legs, swollen grey body.",
  },
  {
    file: "woodchuck-tick.jpg",
    speciesId: "woodchuck-tick",
    stage: "nymph",
    title: "Ixodes cookei.jpg",
    author: "adamfritz (iNaturalist Canada)",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ixodes_cookei.jpg",
    standIn: true,
    alt: "An adult female woodchuck tick after feeding: dark red-brown shield and legs, swollen grey body.",
  },
  {
    file: "woodchuck-tick.jpg",
    speciesId: "woodchuck-tick",
    stage: "adult",
    title: "Ixodes cookei.jpg",
    author: "adamfritz (iNaturalist Canada)",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ixodes_cookei.jpg",
    standIn: false,
    alt: "An adult female woodchuck tick after feeding: dark red-brown shield and legs, swollen grey body.",
  },
];

export function tickPhoto(speciesId: string, stage: TickStage): TickPhotoCredit | undefined {
  return TICK_PHOTOS.find((p) => p.speciesId === speciesId && p.stage === stage);
}

export function tickPhotoSrc(photo: TickPhotoCredit): string {
  return `/ticks/${photo.file}`;
}

// What a stand-in actually shows, e.g. "(adult shown)"
export function standInNote(photo: TickPhotoCredit): string | null {
  return photo.standIn ? "(adult shown)" : null;
}
