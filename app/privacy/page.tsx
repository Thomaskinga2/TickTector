import type { Metadata } from "next";
import { Page, Section } from "@/components/page";

export const metadata: Metadata = { title: "Privacy" };

// Linked from the Google sign-in consent screen (Google Auth Platform > Branding). Keep it true to lib/auth.ts
// and lib/providers/forum-store.ts.
export default function PrivacyPage() {
  return (
    <Page title="Privacy" back={{ href: "/forum", label: "Sightings" }}>
      <p className="px-1 type-body">
        TikTector is a student project from Hackachusetts 2026. You can read everything without an account. You only sign in
        with Google to post or comment in Sightings.
      </p>
      <Section title="When you sign in with Google">
        <p className="soft-block p-4 type-body">
          We keep your Google name, your profile photo and an account number Google gives us, so your posts show who wrote
          them. We never ask for or keep your email address, contacts or anything else in your Google account.
        </p>
      </Section>
      <Section title="What you post">
        <p className="soft-block p-4 type-body">
          Your text, your photos, and the town you choose. We remove all location data hidden inside photos (EXIF, including
          GPS) before they are saved, and we never save your exact location, only the town and county.
        </p>
      </Section>
      <Section title="How long we keep it">
        <p className="soft-block p-4 type-body">
          This is a demo: posts, photos and comments are kept in the server&apos;s memory and are deleted whenever the app is
          updated or restarted. Likes and your Tickdex stay in your own browser. There are no ads and no tracking.
        </p>
      </Section>
      <Section title="Questions or removal">
        <p className="soft-block p-4 type-body">
          Use Report on any post, sign out at any time from Sightings, or open an issue at{" "}
          <a href="https://github.com/Thomaskinga2/my-app/issues" className="text-primary underline" target="_blank" rel="noopener noreferrer">
            github.com/Thomaskinga2/my-app
          </a>
          .
        </p>
      </Section>
    </Page>
  );
}
