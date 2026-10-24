import { getForumStore } from "@/lib/providers/forum-store";

// GET /api/forum/images/:id -> the stored image (already EXIF-free, see lib/forum-images.ts)
export async function GET(_request: Request, ctx: RouteContext<"/api/forum/images/[id]">) {
  const { id } = await ctx.params;
  const image = await getForumStore().getImage(id);
  if (!image) return Response.json({ error: "Image not found" }, { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: { "Content-Type": image.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
