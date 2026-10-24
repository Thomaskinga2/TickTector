import { z } from "zod";
import { isDemoMode } from "@/lib/mock-data";
import { MA_TOWNS } from "@/lib/providers/risk";
import type { Town } from "@/lib/types";

// Server-only: called from app/api/towns/*. Provider keys stay on the server.

export interface GeocodingProvider {
  reverseGeocode(lat: number, lng: number): Promise<{ town: string; county: string; state: string } | null>;
  searchPlaces(q: string): Promise<Town[]>;
}

// Search runs over all 351 cities and towns (US Census). Reverse geocoding picks the nearest town's label point,
// which is only approximate near town lines: the offline fallback for censusProvider.
export const mockProvider: GeocodingProvider = {
  async reverseGeocode(lat, lng) {
    // Outside a box around Massachusetts, answer "not in MA" rather than the nearest MA town.
    if (lat < 41.2 || lat > 42.9 || lng < -73.6 || lng > -69.8) return null;
    const nearest = MA_TOWNS.reduce((best, t) =>
      Math.hypot(t.lat - lat, t.lng - lng) < Math.hypot(best.lat - lat, best.lng - lng) ? t : best,
    );
    return { town: nearest.name, county: nearest.county, state: "MA" };
  },
  async searchPlaces(q) {
    const needle = q.trim().toLowerCase();
    return MA_TOWNS.filter((t) => t.name.toLowerCase().includes(needle));
  },
};

// US Census Bureau Geocoder (free, no key): the city or town whose official boundary contains the point.
// https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html
const CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";
const CensusPlaces = z.array(z.object({ BASENAME: z.string(), STATE: z.string() })).optional();
const CensusResponse = z.object({
  result: z.object({ geographies: z.object({ "County Subdivisions": CensusPlaces, Counties: CensusPlaces }) }),
});

export const censusProvider: GeocodingProvider = {
  async reverseGeocode(lat, lng) {
    const url = `${CENSUS_URL}?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=County+Subdivisions,Counties&format=json`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Census Geocoder returned ${res.status}`);
      const { result } = CensusResponse.parse(await res.json());
      const town = result.geographies["County Subdivisions"]?.[0];
      const county = result.geographies["Counties"]?.[0];
      if (!town || !county) return null;
      // "Amherst Town" -> "Amherst", as in lib/data/ma-towns.json (scripts/build-map.mjs).
      const state = town.STATE === "25" ? "MA" : town.STATE;
      return { town: town.BASENAME.replace(/ Town$/, ""), county: county.BASENAME, state };
    } catch (error) {
      console.warn(`Census Geocoder unavailable, using the nearest town: ${(error as Error).message}`);
      return mockProvider.reverseGeocode(lat, lng);
    }
  },
  searchPlaces: (q) => mockProvider.searchPlaces(q),
};

const notImplemented: GeocodingProvider = {
  async reverseGeocode() {
    throw new Error("TODO: not implemented");
  },
  async searchPlaces() {
    throw new Error("TODO: not implemented");
  },
};

// The city or town containing a point, or null outside Massachusetts. Throws if the provider isn't implemented.
export async function townAt(lat: number, lng: number): Promise<Town | null> {
  const place = await getGeocodingProvider().reverseGeocode(lat, lng);
  if (!place || place.state !== "MA") return null;
  const known = MA_TOWNS.find((t) => t.name.toLowerCase() === place.town.toLowerCase());
  return known ?? { id: place.town.toLowerCase().replace(/\s+/g, "-"), name: place.town, county: place.county, lat, lng };
}

export function getGeocodingProvider(): GeocodingProvider {
  if (isDemoMode()) return mockProvider;
  switch (process.env.GEOCODING_PROVIDER ?? "census") {
    case "census":
      return censusProvider;
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
