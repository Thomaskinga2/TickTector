import { isDemoMode, TOWNS } from "@/lib/mock-data";
import type { Town } from "@/lib/types";

// Server-only: called from app/api/towns/*. Provider keys stay on the server.

export interface GeocodingProvider {
  reverseGeocode(lat: number, lng: number): Promise<{ town: string; county: string; state: string } | null>;
  searchPlaces(q: string): Promise<Town[]>;
}

export const mockProvider: GeocodingProvider = {
  // TODO: replace with a real provider; mock always answers Amherst.
  async reverseGeocode() {
    return { town: "Amherst", county: "Hampshire", state: "MA" };
  },
  async searchPlaces(q) {
    const needle = q.trim().toLowerCase();
    return TOWNS.filter((t) => t.name.toLowerCase().includes(needle));
  },
};

const notImplemented: GeocodingProvider = {
  async reverseGeocode() {
    throw new Error("TODO: not implemented");
  },
  async searchPlaces() {
    throw new Error("TODO: not implemented");
  },
};

export function getGeocodingProvider(): GeocodingProvider {
  if (isDemoMode()) return mockProvider;
  switch (process.env.GEOCODING_PROVIDER ?? "mock") {
    case "mock":
      return mockProvider;
    // TODO: implement with process.env.GEOCODING_API_KEY
    case "google":
    case "mapbox":
    case "nominatim":
      return notImplemented;
    default:
      throw new Error(`Unknown GEOCODING_PROVIDER: ${process.env.GEOCODING_PROVIDER}`);
  }
}
