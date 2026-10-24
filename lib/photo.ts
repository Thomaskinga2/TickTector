"use client";

// Longest side, in px: plenty to tell a deer tick from a dog tick, small enough to upload on cell data.
const MAX_SIDE = 1600;

// Redraws a picked photo as a JPEG at most MAX_SIDE px. Redrawing also drops its EXIF (including GPS),
// and the API strips metadata again on the server. Rejects with a readable message if the browser can't decode it.
export async function preparePhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a photo (JPEG, PNG or HEIC)");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Couldn't open that photo. Try another one.");
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("Couldn't open that photo. Try another one.");
  return new File([blob], "sighting.jpg", { type: "image/jpeg" });
}
