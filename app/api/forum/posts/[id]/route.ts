import { z } from "zod";
import { getForumStore, isModerator } from "@/lib/providers/forum-store";

// GET /api/forum/posts/:id -> ForumPost
export async function GET(_request: Request, ctx: RouteContext<"/api/forum/posts/[id]">) {
  const { id } = await ctx.params;
  try {
    const post = await getForumStore().getPost(id);
    if (!post) return Response.json({ error: "This post doesn't exist or was removed" }, { status: 404 });
    return Response.json(post);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
}

// PATCH /api/forum/posts/:id { hidden: true | false } -> { hidden } (moderators only)
//   curl -X PATCH -H "x-mod-token: $FORUM_MOD_TOKEN" -H "Content-Type: application/json" \
//     -d '{"hidden":true}' https://<site>/api/forum/posts/<id>
export async function PATCH(request: Request, ctx: RouteContext<"/api/forum/posts/[id]">) {
  if (!isModerator(request)) return Response.json({ error: "Moderators only" }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = z.object({ hidden: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Send { "hidden": true } or { "hidden": false }' }, { status: 400 });
  const found = await getForumStore().setHidden(id, parsed.data.hidden);
  if (!found) return Response.json({ error: "No post with that id" }, { status: 404 });
  return Response.json({ hidden: parsed.data.hidden });
}
