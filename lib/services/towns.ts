import type { Town } from "@/lib/types";
import { getJson } from "./http";

export function searchTowns(q: string): Promise<Town[]> {
  return getJson(`/api/towns?q=${encodeURIComponent(q)}`);
}

export function findNearestTown(lat: number, lng: number): Promise<Town> {
  return getJson(`/api/towns/nearest?lat=${lat}&lng=${lng}`);
}

// The town around the visitor's IP address (city-level, so approximate).
export function findApproximateTown(): Promise<Town> {
  return getJson("/api/towns/approximate");
}
