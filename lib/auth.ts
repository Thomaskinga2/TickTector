// Server-only: Sign in with Google for the forum. Posting needs a signed-in user; reading stays public.
// Flow: Google's button gives the browser an ID token -> POST /api/auth/session checks it with Google ->
// we set our own signed session cookie holding the user's name and picture (never the email).
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { SessionUser } from "@/lib/types";

const COOKIE = "tt_session";
const MAX_AGE_S = 7 * 24 * 60 * 60;

// ponytail: Google's tokeninfo endpoint checks the token for us (signature, expiry). Google calls it a debugging
// endpoint; fine for the demo. Long term: verify the JWT locally against Google's keys, or move to Auth.js.
const TokenInfo = z.object({
  aud: z.string(),
  iss: z.string(),
  sub: z.string(),
  exp: z.coerce.number(),
  name: z.string().optional(),
  given_name: z.string().optional(),
  picture: z.string().url().optional(),
});

export async function verifyGoogleToken(idToken: string): Promise<SessionUser | null> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`).catch(() => null);
  const info = TokenInfo.safeParse(res?.ok ? await res.json().catch(() => null) : null);
  if (!info.success) return null;
  const { aud, iss, sub, exp, name, given_name, picture } = info.data;
  const valid = aud === clientId && (iss === "accounts.google.com" || iss === "https://accounts.google.com") && exp * 1000 > Date.now();
  return valid ? { id: sub, name: (name || given_name || "Google user").slice(0, 40), picture } : null;
}

const sign = (data: string) => createHmac("sha256", process.env.AUTH_SECRET ?? "").update(data).digest("base64url");

// "<payload>.<signature>": the payload is readable but can't be changed without AUTH_SECRET.
export function sessionCookie(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + MAX_AGE_S * 1000 })).toString("base64url");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_S}${secure}`;
}

export const clearSessionCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

// The signed-in user, or null (no cookie, bad signature, expired, or AUTH_SECRET unset).
export function getSessionUser(request: Request): SessionUser | null {
  if (!process.env.AUTH_SECRET) return null;
  const raw = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))?.[1];
  const [payload, signature] = raw?.split(".") ?? [];
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { exp, ...user } = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser & { exp: number };
    return exp > Date.now() ? user : null;
  } catch {
    return null;
  }
}

export const signInRequired = () => Response.json({ error: "Sign in with Google to post" }, { status: 401 });
