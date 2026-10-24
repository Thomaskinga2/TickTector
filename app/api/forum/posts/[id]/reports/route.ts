import { z } from "zod";
import { getForumStore } from "@/lib/providers/forum-store";

const NewReport = z.object({
  commentId: z.string().max(100).optional(),
  reason: z.string().trim().max(500).default(""),
});

// POST /api/forum/posts/:id/reports { commentId?, reason? } -> 201. Moderators read them at GET /api/forum/reports.
export async function POST(request: Request, ctx: RouteContext<"/api/forum/posts/[id]/reports">) {
  const { id } = await ctx.params;
  const parsed = NewReport.safeParse((await request.json().catch(() => null)) ?? {});
  if (!parsed.success) return Response.json({ error: "Invalid report" }, { status: 400 });
  const store = getForumStore();
  if (!(await store.getPost(id))) return Response.json({ error: "This post doesn't exist or was removed" }, { status: 404 });
  await store.addReport({ postId: id, ...parsed.data });
  return Response.json({ reported: true }, { status: 201 });
}
