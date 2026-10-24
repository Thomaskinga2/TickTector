const MAX_BYTES = 10 * 1024 * 1024;

// POST /api/scan (multipart, field "photo") -> ScanResult
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File)) return Response.json({ error: "Attach a photo of the tick" }, { status: 400 });
  if (!photo.type.startsWith("image/")) return Response.json({ error: "The file must be an image" }, { status: 400 });
  if (photo.size > MAX_BYTES) return Response.json({ error: "Photo must be under 10 MB" }, { status: 413 });

  // TODO: send the photo to a vision model and validate its JSON with zod. Until then, say so rather than guess.
  return Response.json({ error: "Photo identification isn't available yet" }, { status: 501 });
}
