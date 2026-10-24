"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { LocationButton } from "@/components/location-button";
import { TownSelect } from "@/components/town-select";
import { Button } from "@/components/ui/button";
import type { NewPostInput, Town } from "@/lib/types";

const FIELD = "h-12 w-full rounded-lg border bg-card px-3 text-base";
const MAX_PHOTOS = 4;

export function NewPostForm({ onSubmit }: { onSubmit: (input: NewPostInput) => Promise<void> }) {
  const [town, setTown] = useState<Town>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tickSpecies, setTickSpecies] = useState("");
  const [author, setAuthor] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!town) return setError("Choose a town");
    if (!title.trim() && !body.trim() && !photos.length) return setError("Write something or add a photo");
    setSubmitting(true);
    setError(null);
    try {
      // Only the town is sent. "Use my location" just picks the town; coordinates are never saved.
      await onSubmit({ townId: town.id, title, body, tickSpecies: tickSpecies || undefined, author, photos });
      // Pages stay mounted across navigations (Cache Components), so clear the form for next time.
      setTitle("");
      setBody("");
      setTickSpecies("");
      setPhotos([]);
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
        <LocationButton onTown={setTown} />
      </Field>

      <Field label="Title (optional)" htmlFor="post-title">
        <input id="post-title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={FIELD} />
      </Field>

      <Field label="What did you see?" htmlFor="post-body">
        <textarea
          id="post-body"
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

      <Field label={`Photos (optional, up to ${MAX_PHOTOS})`}>
        {photos.length > 0 && (
          <ul className="grid grid-cols-4 gap-2">
            {photos.map((photo, i) => (
              <li key={previews[i]} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the user's file */}
                <img src={previews[i]} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => setPhotos((prev) => prev.filter((p) => p !== photo))}
                  className="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full border bg-card"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        {photos.length < MAX_PHOTOS && (
          <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-base">
            <ImagePlus className="size-5" aria-hidden />
            Add photos
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                setPhotos((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
                e.target.value = "";
              }}
            />
          </label>
        )}
        <p className="text-sm text-muted-foreground">JPEG, PNG or WebP. Location data inside photos is removed.</p>
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
