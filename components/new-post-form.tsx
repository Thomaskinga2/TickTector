"use client";

import { useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { CameraCapture } from "@/components/camera-capture";
import { TownSelect } from "@/components/town-select";
import { Button } from "@/components/ui/button";
import { features } from "@/lib/features";
import type { NewPostInput, Town } from "@/lib/types";
import { useGeolocation } from "@/lib/use-geolocation";

const FIELD = "h-12 w-full rounded-lg border bg-card px-3 text-base";

export function NewPostForm({ onSubmit }: { onSubmit: (input: NewPostInput) => Promise<void> }) {
  const geo = useGeolocation();
  const [town, setTown] = useState<Town>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tickSpecies, setTickSpecies] = useState("");
  const [author, setAuthor] = useState("");
  const [photo, setPhoto] = useState<File>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!town) return setError("Choose a town");
    setSubmitting(true);
    setError(null);
    try {
      // Without "Use my location", the post is pinned to the town center. The API rounds both to ~1 km.
      await onSubmit({
        townId: town.id,
        lat: geo.coords?.lat ?? town.lat,
        lng: geo.coords?.lng ?? town.lng,
        title,
        body,
        tickSpecies: tickSpecies || undefined,
        author,
        photo,
      });
      // Pages stay mounted across navigations (Cache Components), so clear the form for next time.
      setTitle("");
      setBody("");
      setTickSpecies("");
      setPhoto(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="Town" htmlFor="post-town">
        <TownSelect id="post-town" value={town?.id ?? ""} onChange={(_, t) => setTown(t)} />
      </Field>

      {features.geolocation ? (
        <div className="flex flex-col gap-1">
          <Button type="button" variant="outline" className="h-12 text-base" onClick={geo.request} disabled={geo.loading}>
            {geo.loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <LocateFixed className="size-5" aria-hidden />}
            {geo.coords ? "Location added (about 1 km)" : "Use my location"}
          </Button>
          {geo.error && <p className="text-sm text-risk-high">{geo.error}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">The sighting will be pinned to the center of the town you choose.</p>
      )}

      <Field label="Title" htmlFor="post-title">
        <input id="post-title" required minLength={3} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={FIELD} />
      </Field>

      <Field label="What did you see?" htmlFor="post-body">
        <textarea
          id="post-body"
          required
          maxLength={2000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-lg border bg-card p-3 text-base"
        />
      </Field>

      <Field label="Tick type, if you know it" htmlFor="post-species">
        <input id="post-species" maxLength={80} value={tickSpecies} onChange={(e) => setTickSpecies(e.target.value)} className={FIELD} />
      </Field>

      <Field label="Photo (optional)">
        <CameraCapture onCapture={setPhoto} label={photo ? "Retake photo" : "Add a photo"} />
        {photo && <p className="text-sm text-muted-foreground">Photo added: {photo.name}</p>}
      </Field>

      <Field label="Display name" htmlFor="post-author">
        <input id="post-author" required maxLength={40} autoComplete="nickname" value={author} onChange={(e) => setAuthor(e.target.value)} className={FIELD} />
      </Field>

      <p className="text-sm text-muted-foreground">Do not post personal information.</p>

      {error && (
        <p role="alert" className="text-risk-high">
          {error}
        </p>
      )}

      <Button type="submit" className="h-12 text-base" disabled={submitting}>
        {submitting && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {submitting ? "Posting…" : "Post sighting"}
      </Button>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="font-medium">
          {label}
        </label>
      ) : (
        <p className="font-medium">{label}</p>
      )}
      {children}
    </div>
  );
}
