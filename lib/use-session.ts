"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getSession, signIn, signOut } from "@/lib/services/auth";
import type { SessionUser } from "@/lib/types";

// Who is signed in, shared by every screen. `loaded` is false until the first check answers.
type Session = { user: SessionUser | null; loaded: boolean };

const SIGNED_OUT: Session = { user: null, loaded: false };
let current = SIGNED_OUT;
let checked = false;
const listeners = new Set<() => void>();
const set = (next: Session) => {
  current = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export function useSession(): Session {
  const session = useSyncExternalStore(subscribe, () => current, () => SIGNED_OUT);
  useEffect(() => {
    if (checked) return;
    checked = true;
    getSession().then(
      ({ user }) => set({ user, loaded: true }),
      () => set({ user: null, loaded: true }),
    );
  }, []);
  return session;
}

export async function signInWithGoogle(credential: string) {
  const { user } = await signIn(credential);
  set({ user, loaded: true });
  return user;
}

export async function signOutOfGoogle() {
  await signOut();
  window.google?.accounts.id.disableAutoSelect();
  set({ user: null, loaded: true });
}
