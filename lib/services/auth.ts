import type { SessionUser } from "@/lib/types";
import { getJson } from "./http";

export function getSession(): Promise<{ user: SessionUser | null }> {
  return getJson("/api/auth/session");
}

// credential: the ID token from Google's button. Sets the session cookie.
export function signIn(credential: string): Promise<{ user: SessionUser }> {
  return getJson("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
}

export function signOut(): Promise<{ user: null }> {
  return getJson("/api/auth/session", { method: "DELETE" });
}
