import { getForumStore, isModerator } from "@/lib/providers/forum-store";

// GET /api/forum/reports -> ForumReport[] (moderators only, header "x-mod-token: $FORUM_MOD_TOKEN")
// Hide a reported post with PATCH /api/forum/posts/:id (see that route).
export async function GET(request: Request) {
  if (!isModerator(request)) return Response.json({ error: "Moderators only" }, { status: 403 });
  return Response.json(await getForumStore().listReports());
}
