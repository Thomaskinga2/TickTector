import { z } from "zod";
import { getForumStore } from "@/lib/providers/forum-store";

const NewComment = z.object({
  body: z.string().trim().min(1, "Write a comment first").max(1000, "Comment is too long"),
  author: z.string().trim().min(1, "Add a display name").max(40, "Display name is too long"),
});

// GET /api/forum/posts/:id/comments -> ForumComment[]
export async function GET(_request: Request, ctx: RouteContext<"/api/forum/posts/[id]/comments">) {
  const { id } = await ctx.params;
  try {
    const store = getForumStore();
    if (!(await store.getPost(id))) return Response.json({ error: "This post doesn't exist or was removed" }, { status: 404 });
    return Response.json(await store.listComments(id));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
}

// POST /api/forum/posts/:id/comments { body, author } -> ForumComment
export async function POST(request: Request, ctx: RouteContext<"/api/forum/posts/[id]/comments">) {
  const { id } = await ctx.params;
  const parsed = NewComment.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid comment" }, { status: 400 });
  }
  try {
    const store = getForumStore();
    if (!(await store.getPost(id))) return Response.json({ error: "This post doesn't exist or was removed" }, { status: 404 });
    const comment = await store.addComment(id, parsed.data.body, parsed.data.author);
    return Response.json(comment, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 501 });
  }
}
