"use client";

import { useCallback, useEffect, useState } from "react";
import { findApproximateTown, findNearestTown } from "@/lib/services/towns";
import type { Town } from "@/lib/types";
import { type Coords, useGeolocation } from "@/lib/use-geolocation";

// precise: from the device's location. Otherwise approximate, from the IP address.
export type NearMe = { town: Town; coords: Coords; precise: boolean };

// Kept for the page's lifetime, so coming back to Home doesn't ask again.
let remembered: NearMe | null = null;
let started = false;

// Home's starting point. The first time it mounts, it asks the browser for the location and, meanwhile, looks up
// the town around the IP address, so nearby towns still show when the prompt is dismissed or denied.
export function useNearMe(enabled: boolean) {
  const geo = useGeolocation();
  const [near, setNear] = useState(remembered);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const request = geo.request;

  const keep = useCallback((next: NearMe) => {
    remembered = next;
    setNear(next);
  }, []);

  const locate = useCallback(async () => {
    setLookupError(null);
    const coords = await request();
    if (!coords) return;
    setLookingUp(true);
    try {
      keep({ town: await findNearestTown(coords.lat, coords.lng), coords, precise: true });
    } catch (err) {
      setLookupError((err as Error).message);
    } finally {
      setLookingUp(false);
    }
  }, [request, keep]);

  useEffect(() => {
    if (!enabled || started) return;
    started = true;
    findApproximateTown()
      .then((town) => {
        if (!remembered?.precise) keep({ town, coords: { lat: town.lat, lng: town.lng }, precise: false });
      })
      .catch(() => {}); // No IP location (local dev, outside MA): the precise ask still runs.
    // Asks after this commit rather than setting "loading" during it.
    void Promise.resolve().then(locate);
  }, [enabled, keep, locate]);

  return { near, locating: geo.loading || lookingUp, error: geo.error ?? lookupError, locate };
}
