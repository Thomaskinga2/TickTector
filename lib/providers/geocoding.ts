import geo from "@/public/geo/ma-towns.json";
import { isDemoMode, TOWNS as MOCK_TOWNS } from "@/lib/mock-data";
import { findTown, TOWNS } from "@/lib/risk-model";
import type { Town } from "@/lib/types";

// Server-only: called from app/api/towns/*. Provider keys stay on the server.

export interface GeocodingProvider {
  reverseGeocode(lat: number, lng: number): Promise<{ town: string; county: string; state: string } | null>;
  searchPlaces(q: string): Promise<Town[]>;
}

// Prefix matches first, then other matches. Empty query returns every town (for pickers).
function search(list: Town[], q: string, limit = 8): Town[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return list;
  const starts = list.filter((t) => t.name.toLowerCase().startsWith(needle));
  const contains = list.filter((t) => !t.name.toLowerCase().startsWith(needle) && t.name.toLowerCase().includes(needle));
  return [...starts, ...contains].slice(0, limit);
}

export const mockProvider: GeocodingProvider = {
  // Mock always answers Amherst. Used in DEMO_MODE.
  async reverseGeocode() {
    return { town: "Amherst", county: "Hampshire", state: "MA" };
  },
  async searchPlaces(q) {
    return search(MOCK_TOWNS, q);
  },
};

// Default: the bundled MassGIS town list and outlines (lib/data/towns.json, public/geo/ma-towns.json). No network.
type Ring = number[][];
let rings: { id: string; rings: Ring[] }[] | null = null;

function townRings() {
  rings ??= geo.towns.map((t) => ({
    id: t.id,
    rings: t.d
      .split("M")
      .filter(Boolean)
      .map((r) => r.replace("Z", "").split("L").map((p) => p.split(" ").map(Number))),
  }));
  return rings;
}

function project(lat: number, lng: number) {
  const { west, north, lat0, scale } = geo.projection;
  return [(lng - west) * Math.cos((lat0 * Math.PI) / 180) * scale, (north - lat) * scale];
}

// Even-odd rule across all rings, so islands and holes work.
function inside(x: number, y: number, shape: Ring[]) {
  let hit = false;
  for (const ring of shape) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
  }
  return hit;
}

const COAST_SNAP_PX = 10; // ~3 km: points just off a simplified coastline still count as the nearest town

export const localProvider: GeocodingProvider = {
  async reverseGeocode(lat, lng) {
    const [x, y] = project(lat, lng);
    let id = townRings().find((t) => inside(x, y, t.rings))?.id;
    if (!id) {
      const nearest = TOWNS.map((t) => {
        const [tx, ty] = project(t.lat, t.lng);
        return { id: t.id, dist: Math.hypot(tx - x, ty - y) };
      }).sort((a, b) => a.dist - b.dist)[0];
      if (nearest.dist <= COAST_SNAP_PX) id = nearest.id;
    }
    const town = id ? findTown(id) : undefined;
    return town ? { town: town.name, county: town.county, state: "MA" } : null;
  },
  async searchPlaces(q) {
    return search(TOWNS, q);
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
  switch (process.env.GEOCODING_PROVIDER ?? "local") {
    case "local":
      return localProvider;
    case "mock":
      return mockProvider;
    // TODO: implement with process.env.GEOCODING_API_KEY if we ever need street-level geocoding.
    case "google":
    case "mapbox":
    case "nominatim":
      return notImplemented;
    default:
      throw new Error(`Unknown GEOCODING_PROVIDER: ${process.env.GEOCODING_PROVIDER}`);
  }
}
