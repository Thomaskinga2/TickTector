import type { NextRequest } from "next/server";
import { z } from "zod";
import { getForumStore, redactPost, roundCoord } from "@/lib/providers/forum-store";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const NewPostFields = z.object({
  townId: z.string({ error: "Choose a town" }).trim().min(1, "Choose a town"),
  lat: z.coerce.number({ error: "Location is missing" }).min(-90).max(90),
  lng: z.coerce.number({ error: "Location is missing" }).min(-180).max(180),
  title: z.string({ error: "Add a title" }).trim().min(3, "Title is too short").max(120, "Title is too long"),
  body: z.string({ error: "Describe what you saw" }).trim().min(1, "Describe what you saw").max(2000, "Description is too long"),
  tickSpecies: z.string().trim().max(80).optional(),
  author: z.string({ error: "Add a display name" }).trim().min(1, "Add a display name").max(40, "Display name is too long"),
});

// GET /api/forum/posts?town=amherst -> ForumPost[]
export async function GET(request: NextRequest) {
  const townId = request.nextUrl.searchParams.get("town") || undefined;
  try {
    const posts = await getForumStore().listPosts(townId);
    return Response.json(posts.map(redactPost));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
}

// POST /api/forum/posts (multipart: NewPostInput fields + optional "photo") -> ForumPost
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "Send the post as multipart form data" }, { status: 400 });

  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" && value.trim() ? value : undefined;
  };
  const parsed = NewPostFields.safeParse({
    townId: text("townId"),
    lat: text("lat"),
    lng: text("lng"),
    title: text("title"),
    body: text("body"),
    tickSpecies: text("tickSpecies"),
    author: text("author"),
  });
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid post" }, { status: 400 });
  }

  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) return Response.json({ error: "The photo must be an image" }, { status: 400 });
    if (photo.size > MAX_PHOTO_BYTES) return Response.json({ error: "Photo must be under 10 MB" }, { status: 413 });
    // TODO: upload the photo to storage (e.g. Supabase Storage) and save its URL as photoUrl.
  }

  try {
    const { lat, lng, ...rest } = parsed.data;
    const post = await getForumStore().createPost({ ...rest, lat: roundCoord(lat), lng: roundCoord(lng) });
    return Response.json(redactPost(post), { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
}
