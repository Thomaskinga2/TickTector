"use client";

import { useCallback, useState } from "react";

export type Coords = { lat: number; lng: number };

// Wraps navigator.geolocation. Callers fall back to town search when `error` is set.
export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Location isn't available on this device. Search for your town instead.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access is off. Search for your town instead."
            : err.code === err.TIMEOUT
              ? "Finding your location took too long. Search for your town instead."
              : "Couldn't find your location. Search for your town instead.",
        );
        setLoading(false);
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  return { coords, error, loading, request };
}
