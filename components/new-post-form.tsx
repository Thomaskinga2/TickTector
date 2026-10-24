"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ImagePlus, Loader2, LocateFixed, X } from "lucide-react";
import { TownSelect } from "@/components/town-select";
import { Button } from "@/components/ui/button";
import { features } from "@/lib/features";
import { preparePhoto } from "@/lib/photo";
import type { NewPostInput, Town } from "@/lib/types";
import { useGeolocation } from "@/lib/use-geolocation";
import { cn } from "@/lib/utils";

export const NEW_POST_FORM_ID = "new-post-form";

const INPUT = "h-11 w-full bg-transparent type-body outline-none placeholder:text-muted-foreground";

// An iOS form: grouped rows with labels, footers for the privacy notes. The Post button lives in the nav bar
// (it submits this form by id), so the page passes onSubmittingChange to disable it while sending
// and onReadyChange to keep it disabled until the required fields are filled.
export function NewPostForm({
  onSubmit,
  onSubmittingChange,
  onReadyChange,
}: {
  onSubmit: (input: NewPostInput) => Promise<void>;
  onSubmittingChange?: (submitting: boolean) => void;
  onReadyChange?: (ready: boolean) => void;
}) {
  const geo = useGeolocation();
  const [town, setTown] = useState<Town>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tickSpecies, setTickSpecies] = useState("");
  const [author, setAuthor] = useState("");
  const [photo, setPhoto] = useState<File>();
  const [error, setError] = useState<string | null>(null);

  // Mirrors the inputs' own constraints (title minLength 3, body and name required).
  const ready = !!town && title.trim().length >= 3 && body.trim().length > 0 && author.trim().length > 0;
  useEffect(() => onReadyChange?.(ready), [ready, onReadyChange]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!town) return setError("Choose a town");
    onSubmittingChange?.(true);
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

      <Group
        footer={
          features.geolocation
            ? "Shown to others within about 1 km, never your exact spot."
            : "Pinned to the center of the town you choose."
        }
      >
        <Row label="Town" htmlFor="post-town">
          <TownSelect id="post-town" value={town?.id ?? ""} onChange={(_, t) => setTown(t)} />
        </Row>
        {features.geolocation && (
          <Row label="Location">
            <Button type="button" variant="plain" size="sm" className="-ml-3.5 self-start" onClick={geo.request} disabled={geo.loading}>
              {geo.loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LocateFixed className="size-4" aria-hidden />}
              {geo.coords ? "Location added (about 1 km)" : "Use my location"}
            </Button>
            {geo.error && <p className="pb-2 type-footnote text-destructive">{geo.error}</p>}
          </Row>
        )}
      </Group>

      <Group>
        <Row label="Title" htmlFor="post-title">
          <input id="post-title" required minLength={3} maxLength={120} placeholder="What you found, and where" value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT} />
        </Row>
        <Row label="What did you see?" htmlFor="post-body">
          <textarea
            id="post-body"
            required
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

      <Group footer="Optional. Location data in the photo is removed before it's posted.">
        <PhotoField photo={photo} onChange={setPhoto} />
      </Group>

      <Group footer="Don't include personal information.">
        <Row label="Display name" htmlFor="post-author">
          <input id="post-author" required maxLength={40} autoComplete="nickname" placeholder="First name or nickname" value={author} onChange={(e) => setAuthor(e.target.value)} className={INPUT} />
        </Row>
      </Group>
    </form>
  );
}

// A photo of the tick: a tap opens the camera or the photo library (iOS offers both). The picked photo is
// resized to a JPEG before upload, and its preview has a remove button.
function PhotoField({ photo, onChange }: { photo?: File; onChange: (photo?: File) => void }) {
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(() => photo && URL.createObjectURL(photo), [photo]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function pick(file: File) {
    setPreparing(true);
    setError(null);
    try {
      onChange(await preparePhoto(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {photo && preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local preview (blob: URL) */}
          <img src={preview} alt="Your photo" className="max-h-64 w-full rounded-xl bg-fill object-cover" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Remove photo"
            className="glass pressable absolute top-2 right-2 grid size-9 place-items-center rounded-full text-foreground"
          >
            <X className="size-[18px]" strokeWidth={2.4} aria-hidden />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            "pressable flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-separator text-primary",
            "focus-within:ring-2 focus-within:ring-ring/60",
            preparing && "pointer-events-none opacity-60",
          )}
        >
          {preparing ? <Loader2 className="size-7 animate-spin" aria-hidden /> : <ImagePlus className="size-7" strokeWidth={2} aria-hidden />}
          <span className="type-headline">{preparing ? "Adding photo…" : "Add a photo of the tick"}</span>
          <span className="type-footnote text-muted-foreground">Take one or choose from your library</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={preparing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void pick(file);
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
