"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { LogOut } from "lucide-react";
import { toast } from "@/components/toaster";
import { cn } from "@/lib/utils";
import { signInWithGoogle, signOutOfGoogle, useSession } from "@/lib/use-session";

// Google Identity Services, loaded from Google: https://developers.google.com/identity/gsi/web
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void;
          renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
          disableAutoSelect(): void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Google's own "Sign in with Google" button. Signing in sets our session cookie (lib/auth.ts).
export function GoogleSignIn({ prompt }: { prompt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const google = window.google;
    if (!ready || !google || !ref.current || !CLIENT_ID) return;
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: ({ credential }) =>
        signInWithGoogle(credential).then(
          (user) => toast(`Signed in as ${user.name}`),
          (err: Error) => setError(err.message),
        ),
    });
    google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", shape: "pill", text: "signin_with", width: 260 });
  }, [ready]);

  return (
    <div className="soft-block flex flex-col items-center gap-3 px-4 py-4 text-center">
      <p className="type-subhead text-muted-foreground">{prompt}</p>
      {CLIENT_ID ? (
        <>
          <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setReady(true)} />
          <div ref={ref} className="flex min-h-11 justify-center" />
        </>
      ) : (
        <p className="type-footnote text-destructive">Sign-in isn&apos;t set up yet (NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing).</p>
      )}
      {error && (
        <p role="alert" className="type-footnote text-destructive">
          {error}
        </p>
      )}
      <Link href="/privacy" className="type-footnote text-primary">
        What we keep when you sign in
      </Link>
    </div>
  );
}

// Who's posting: the Google name and photo, with Sign out. Signed out: the sign-in button with `prompt`.
export function AccountRow({ prompt }: { prompt: string }) {
  const { user, loaded } = useSession();
  if (!loaded) return null;
  if (!user) return <GoogleSignIn prompt={prompt} />;
  return (
    <div className="flex items-center gap-2.5 px-1">
      <Avatar name={user.name} picture={user.picture} className="size-7" />
      <p className="min-w-0 flex-1 truncate type-subhead">
        <span className="text-muted-foreground">Signed in as </span>
        {user.name}
      </p>
      <button
        type="button"
        onClick={() => signOutOfGoogle().then(() => toast("Signed out"), () => toast("Couldn't sign out"))}
        className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 type-subhead text-primary"
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </button>
    </div>
  );
}

// A Google profile photo, or the first letter of the name.
export function Avatar({ name, picture, className }: { name: string; picture?: string; className?: string }) {
  return picture ? (
    // eslint-disable-next-line @next/next/no-img-element -- Google profile photo; no-referrer, or Google may refuse it
    <img src={picture} alt="" referrerPolicy="no-referrer" className={cn("shrink-0 rounded-full bg-fill object-cover", className)} />
  ) : (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full bg-fill font-semibold text-primary", className)}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
