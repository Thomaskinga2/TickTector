"use client";

import { useEffect, useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { features } from "@/lib/features";
import { findNearestTown } from "@/lib/services/towns";
import type { Town } from "@/lib/types";
import { useGeolocation } from "@/lib/use-geolocation";

// "Use my location": coords -> nearest MA town. On any error, onError lets the parent focus town search.
export function LocationButton({ onTown, onError }: { onTown: (town: Town) => void; onError?: () => void }) {
  const geo = useGeolocation();
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    if (!geo.coords) return;
    setLookingUp(true);
    setLookupError(null);
    findNearestTown(geo.coords.lat, geo.coords.lng)
      .then(onTown, (err: Error) => setLookupError(err.message))
      .finally(() => setLookingUp(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.coords]);

  const error = geo.error ?? lookupError;
  useEffect(() => {
    if (error) onError?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  if (!features.geolocation) {
    return (
      <Button variant="outline" disabled className="h-12 w-full text-base">
        <LocateFixed className="size-5" aria-hidden />
        Use my location (coming soon)
      </Button>
    );
  }

  const busy = geo.loading || lookingUp;
  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" className="h-12 w-full text-base" onClick={geo.request} disabled={busy}>
        {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <LocateFixed className="size-5" aria-hidden />}
        {busy ? "Finding your town…" : "Use my location"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-risk-high">
          {error}
        </p>
      )}
    </div>
  );
}
