// Server-only: every forum image (text and scan posts) goes through cleanImage before it is stored.
import sharp from "sharp";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGES = 4;
const MAX_SIDE = 1600;
const TYPES = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Checks the real format from the bytes (the declared type can lie), then re-encodes the image.
// sharp writes no metadata unless asked, so EXIF (GPS included), XMP and IPTC are all dropped.
// rotate() first applies the EXIF orientation, so phone photos stay upright without it.
export async function cleanImage(file: Blob): Promise<{ bytes: Buffer; type: string }> {
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Each image must be under 10 MB", 413);
  const input = Buffer.from(await file.arrayBuffer());
  const format = await sharp(input)
    .metadata()
    .then((m) => m.format, () => undefined);
  if (format !== "jpeg" && format !== "png" && format !== "webp") throw new UploadError("Invalid image: use a JPEG, PNG or WebP photo");
  const bytes = await sharp(input)
    .rotate()
    .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .toFormat(format)
    .toBuffer();
  return { bytes, type: TYPES[format] };
}
