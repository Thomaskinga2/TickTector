import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser, signInRequired } from "@/lib/auth";
import { cleanImage, MAX_IMAGES, UploadError } from "@/lib/forum-images";
import { getForumStore, townFromName, type NewPostRecord } from "@/lib/providers/forum-store";
import { findTown } from "@/lib/providers/risk";
import { SCAN_SPECIES, SCAN_SPECIES_NAME, SCAN_STAGES } from "@/lib/types";

const TextFields = z.object({
  townId: z.string({ error: "Choose a town" }).trim().min(1, "Choose a town"),
  title: z.string().trim().max(120, "Title is too long").default(""),
  body: z.string().trim().max(2000, "Description is too long").default(""),
  tickSpecies: z.string().trim().max(80).optional(),
});

// No lat/lng here on purpose: the scan's coordinates never reach the server.
const ScanFields = z.object({
  species: z.enum(SCAN_SPECIES, { error: "Unknown tick species" }),
  confidence: z.coerce.number().min(0, "Confidence must be 0–1").max(1, "Confidence must be 0–1").optional(),
  stage: z.enum(SCAN_STAGES, { error: "Unknown life stage" }).optional(),
  town: z.string({ error: "Location is missing" }).trim().min(1, "Location is missing"),
  scannedAt: z.iso.datetime({ offset: true, error: "scannedAt must be an ISO date-time" }),
  caption: z.string().trim().max(500, "Keep it under 500 characters").optional(),
});

const fail = (error: string, status = 400) => Response.json({ error }, { status });

// GET /api/forum/posts?town=amherst -> ForumPost[] (newest first)
export async function GET(request: NextRequest) {
  const townId = request.nextUrl.searchParams.get("town") || undefined;
  try {
    return Response.json(await getForumStore().listPosts(townId));
  } catch (error) {
    return fail((error as Error).message, 501);
  }
}

// POST /api/forum/posts (multipart) -> ForumPost. Needs a signed-in user (lib/auth.ts), who becomes the author.
//   type=text: townId, title, body, tickSpecies?, photos (0–4 files)
//   type=scan: species, confidence?, stage?, town (MA town name or id), scannedAt, caption?, photos (1 file)
// Every photo is validated and stripped of EXIF (lib/forum-images.ts) before it is stored.
export async function POST(request: Request) {
  const user = getSessionUser(request);
  if (!user) return signInRequired();
  const author = { author: user.name, authorPicture: user.picture };

  const form = await request.formData().catch(() => null);
  if (!form) return fail("Send the post as multipart form data");

  const fields: Record<string, string> = {};
  for (const [key, value] of form) if (typeof value === "string" && value.trim()) fields[key] = value;
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_IMAGES) return fail(`Add up to ${MAX_IMAGES} photos per post`);

  let record: Omit<NewPostRecord, "photos">;
  if (fields.type === "scan") {
    const parsed = ScanFields.safeParse(fields);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid scan");
    const { species, confidence, stage, town: townName, scannedAt, caption } = parsed.data;
    const town = townFromName(townName);
    if (!town) return fail("Location is outside Massachusetts");
    if (files.length !== 1) return fail("Add the tick photo");
    record = {
      type: "scan",
      townId: town.id,
      townName: town.name,
      county: town.county,
      title: SCAN_SPECIES_NAME[species],
      body: caption ?? "",
      scan: { species, confidence, stage, scannedAt },
      ...author,
    };
  } else {
    const parsed = TextFields.safeParse(fields);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid post");
    const { townId, title, body, tickSpecies } = parsed.data;
    const town = findTown(townId);
    if (!town) return fail("Choose a Massachusetts city or town");
    if (!title && !body && !files.length) return fail("Write something or add a photo");
    record = { type: "text", townId, townName: town.name, county: town.county, title, body, tickSpecies, ...author };
  }

  try {
    const store = getForumStore();
    // Clean every photo before saving any, so a bad one doesn't leave the others behind.
    const images = await Promise.all(files.map(cleanImage));
    const photos = await Promise.all(images.map(async (image) => `/api/forum/photos/${await store.savePhoto(image)}`));
    return Response.json(await store.createPost({ ...record, photos }), { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return fail(error.message, error.status);
    return fail((error as Error).message, 501);
  }
}
