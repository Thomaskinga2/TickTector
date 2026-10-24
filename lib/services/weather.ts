import type { Weather } from "@/lib/types";
import { getJson } from "./http";

export function getWeather(townId: string): Promise<Weather> {
  return getJson(`/api/weather?town=${encodeURIComponent(townId)}`);
}
