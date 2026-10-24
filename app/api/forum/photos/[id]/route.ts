import { getForumStore } from "@/lib/providers/forum-store";

// GET /api/forum/photos/:id -> image/jpeg (a post's photo, metadata already stripped)
export async function GET(_request: Request, ctx: RouteContext<"/api/forum/photos/[id]">) {
  const { id } = await ctx.params;
  try {
    const jpeg = await getForumStore().getPhoto(id);
    if (!jpeg) return Response.json({ error: "This photo doesn't exist or was removed" }, { status: 404 });
    return new Response(jpeg as Uint8Array<ArrayBuffer>, {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
}
