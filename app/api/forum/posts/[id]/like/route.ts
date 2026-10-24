import { z } from "zod";
import { getForumStore } from "@/lib/providers/forum-store";

// POST /api/forum/posts/:id/like { liked: true | false } -> { likeCount }
// ponytail: no accounts, so the browser remembers its own likes (localStorage) and anyone can like again.
export async function POST(request: Request, ctx: RouteContext<"/api/forum/posts/[id]/like">) {
  const { id } = await ctx.params;
  const parsed = z.object({ liked: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid like" }, { status: 400 });
  const likeCount = await getForumStore().like(id, parsed.data.liked);
  if (likeCount === null) return Response.json({ error: "This post doesn't exist or was removed" }, { status: 404 });
  return Response.json({ likeCount });
}
