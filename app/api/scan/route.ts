import { SCAN_RESULT } from "@/lib/mock-data";

const MAX_BYTES = 10 * 1024 * 1024;

// POST /api/scan (multipart, field "photo") -> ScanResult
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File)) return Response.json({ error: "Attach a photo of the tick" }, { status: 400 });
  if (!photo.type.startsWith("image/")) return Response.json({ error: "The file must be an image" }, { status: 400 });
  if (photo.size > MAX_BYTES) return Response.json({ error: "Photo must be under 10 MB" }, { status: 413 });

  // TODO: send the photo to a vision model (e.g. Claude via @anthropic-ai/sdk) and validate its JSON.
  return Response.json(SCAN_RESULT);
}
