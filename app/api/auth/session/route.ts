import { z } from "zod";
import { clearSessionCookie, getSessionUser, sessionCookie, verifyGoogleToken } from "@/lib/auth";

// GET /api/auth/session -> { user: SessionUser | null }
export async function GET(request: Request) {
  return Response.json({ user: getSessionUser(request) });
}

// POST /api/auth/session { credential } (the ID token from Google's button) -> { user }, sets the session cookie
export async function POST(request: Request) {
  if (!process.env.AUTH_SECRET) return Response.json({ error: "Sign-in isn't set up yet (AUTH_SECRET is missing)" }, { status: 501 });
  const parsed = z.object({ credential: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Missing Google credential" }, { status: 400 });
  const user = await verifyGoogleToken(parsed.data.credential);
  if (!user) return Response.json({ error: "Couldn't sign in with Google. Try again." }, { status: 401 });
  return Response.json({ user }, { headers: { "Set-Cookie": sessionCookie(user) } });
}

// DELETE /api/auth/session -> signs out
export async function DELETE() {
  return Response.json({ user: null }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
