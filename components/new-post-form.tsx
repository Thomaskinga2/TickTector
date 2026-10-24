"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ImagePlus, Loader2, LocateFixed, X } from "lucide-react";
import { TownSelect } from "@/components/town-select";
import { Button } from "@/components/ui/button";
import { features } from "@/lib/features";
import { preparePhoto } from "@/lib/photo";
import { findNearestTown } from "@/lib/services/towns";
import type { NewPostInput, Town } from "@/lib/types";
import { useGeolocation } from "@/lib/use-geolocation";
import { cn } from "@/lib/utils";

export const NEW_POST_FORM_ID = "new-post-form";

const INPUT = "h-11 w-full bg-transparent type-body outline-none placeholder:text-muted-foreground";
const MAX_PHOTOS = 4;

// An iOS form: grouped rows with labels, footers for the privacy notes. The Post button lives in the nav bar
// (it submits this form by id), so the page passes onSubmittingChange to disable it while sending
// and onReadyChange to keep it disabled until the post has a town and some text or a photo.
export function NewPostForm({
  author,
  onSubmit,
  onSubmittingChange,
  onReadyChange,
}: {
  author: string; // the signed-in Google user, who the post is from
  onSubmit: (input: NewPostInput) => Promise<void>;
  onSubmittingChange?: (submitting: boolean) => void;
  onReadyChange?: (ready: boolean) => void;
}) {
  const [town, setTown] = useState<Town>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tickSpecies, setTickSpecies] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ready = !!town && (title.trim().length > 0 || body.trim().length > 0 || photos.length > 0);
  useEffect(() => onReadyChange?.(ready), [ready, onReadyChange]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!town) return setError("Choose a town");
    onSubmittingChange?.(true);
    setError(null);
    try {
      // Only the town is sent: posts never carry coordinates.
      await onSubmit({ townId: town.id, title, body, tickSpecies: tickSpecies || undefined, photos });
      // Pages stay mounted across navigations (Cache Components), so clear the form for next time.
      setTitle("");
      setBody("");
      setTickSpecies("");
      setPhotos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      onSubmittingChange?.(false);
    }
  }

  return (
    <form id={NEW_POST_FORM_ID} onSubmit={submit} className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="rounded-xl bg-[color-mix(in_oklab,var(--system-red)_12%,transparent)] px-4 py-3 type-subhead text-destructive">
          {error}
        </p>
      )}

      <Group footer="Others see the town only, never your exact spot.">
        <Row label="Town" htmlFor="post-town">
          <TownSelect id="post-town" value={town?.id ?? ""} onChange={(_, t) => setTown(t)} />
        </Row>
        {features.geolocation && <LocateRow onTown={setTown} />}
      </Group>

      <Group footer="Write something, add a photo, or both.">
        <Row label="Title" htmlFor="post-title">
          <input id="post-title" maxLength={120} placeholder="What you found, and where" value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT} />
        </Row>
        <Row label="What did you see?" htmlFor="post-body">
          <textarea
            id="post-body"
            maxLength={2000}
            rows={4}
            placeholder="Where you were, what the tick looked like, what you did."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full resize-none bg-transparent py-2 type-body outline-none placeholder:text-muted-foreground"
          />
        </Row>
        <Row label="Tick type, if you know it" htmlFor="post-species">
          <input id="post-species" maxLength={80} placeholder="For example, deer tick" value={tickSpecies} onChange={(e) => setTickSpecies(e.target.value)} className={INPUT} />
        </Row>
      </Group>

      <Group footer={`Up to ${MAX_PHOTOS}. Location data in photos is removed before they're posted.`}>
        <PhotosField photos={photos} onChange={setPhotos} />
      </Group>

      <p className="px-4 type-footnote text-muted-foreground">Posting as {author}. Don&apos;t include personal information.</p>
    </form>
  );
}

// "Use my location" only picks the town around you; the coordinates stay on the phone.
function LocateRow({ onTown }: { onTown: (town: Town) => void }) {
  const geo = useGeolocation();
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<string | null>(null);

  async function locate() {
    setError(null);
    const coords = await geo.request();
    if (!coords) return;
    setFinding(true);
    try {
      const town = await findNearestTown(coords.lat, coords.lng);
      onTown(town);
      setFound(town.name);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setFinding(false);
    }
  }

  const busy = geo.loading || finding;
  return (
    <Row label="Location">
      <Button type="button" variant="plain" size="sm" className="-ml-3.5 self-start" onClick={locate} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LocateFixed className="size-4" aria-hidden />}
        {found ? `Town set to ${found}` : "Use my location"}
      </Button>
      {(geo.error ?? error) && <p className="pb-2 type-footnote text-destructive">{geo.error ?? error}</p>}
    </Row>
  );
}

// Photos of the tick: a tap opens the camera or the photo library (iOS offers both). Each pick is resized to a
// JPEG before upload (lib/photo.ts), and every preview has a remove button.
function PhotosField({ photos, onChange }: { photos: File[]; onChange: (photos: File[]) => void }) {
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previews = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  async function pick(files: File[]) {
    setPreparing(true);
    setError(null);
    try {
      const ready = await Promise.all(files.slice(0, MAX_PHOTOS - photos.length).map(preparePhoto));
      onChange([...photos, ...ready]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-2">
          {photos.map((photo, i) => (
            <li key={previews[i]} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local preview (blob: URL) */}
              <img src={previews[i]} alt={`Your photo ${i + 1}`} className="aspect-square w-full rounded-xl bg-fill object-cover" />
              <button
                type="button"
                onClick={() => onChange(photos.filter((p) => p !== photo))}
                aria-label={`Remove photo ${i + 1}`}
                className="glass pressable absolute top-2 right-2 grid size-9 place-items-center rounded-full text-foreground"
              >
                <X className="size-[18px]" strokeWidth={2.4} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {photos.length < MAX_PHOTOS && (
        <label
          className={cn(
            "pressable flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-separator text-primary",
            photos.length ? "min-h-16" : "min-h-28",
            "focus-within:ring-2 focus-within:ring-ring/60",
            preparing && "pointer-events-none opacity-60",
          )}
        >
          {preparing ? <Loader2 className="size-7 animate-spin" aria-hidden /> : <ImagePlus className="size-7" strokeWidth={2} aria-hidden />}
          <span className="type-headline">{preparing ? "Adding photos…" : photos.length ? "Add another photo" : "Add photos of the tick"}</span>
          {!photos.length && <span className="type-footnote text-muted-foreground">Take one or choose from your library</span>}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={preparing}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) void pick(files);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="px-1 type-footnote text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Group({ footer, children }: { footer?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="divide-y divide-separator overflow-hidden rounded-xl bg-card">{children}</div>
      {footer && <p className="px-4 type-footnote text-muted-foreground">{footer}</p>}
    </div>
  );
}

function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  const Label = htmlFor ? "label" : "p";
  return (
    <div className="flex flex-col px-4 pt-2.5">
      <Label htmlFor={htmlFor} className={cn("type-footnote font-medium text-muted-foreground")}>
        {label}
      </Label>
      {children}
    </div>
  );
}
