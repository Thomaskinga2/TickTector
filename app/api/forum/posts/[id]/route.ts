import { getForumStore, redactPost } from "@/lib/providers/forum-store";

// GET /api/forum/posts/:id -> ForumPost
export async function GET(_request: Request, ctx: RouteContext<"/api/forum/posts/[id]">) {
  const { id } = await ctx.params;
  try {
    const post = await getForumStore().getPost(id);
    if (!post) return Response.json({ error: "This post doesn't exist or was removed" }, { status: 404 });
    return Response.json(redactPost(post));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
}
