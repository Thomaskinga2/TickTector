import { getForumStore } from "@/lib/providers/forum-store";

// GET /api/forum/photos/:id -> a post's photo (JPEG, PNG or WebP, metadata already removed by lib/forum-images.ts)
export async function GET(_request: Request, ctx: RouteContext<"/api/forum/photos/[id]">) {
  const { id } = await ctx.params;
  try {
    const photo = await getForumStore().getPhoto(id);
    if (!photo) return Response.json({ error: "This photo doesn't exist or was removed" }, { status: 404 });
    return new Response(new Uint8Array(photo.bytes), {
      headers: { "Content-Type": photo.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
}
