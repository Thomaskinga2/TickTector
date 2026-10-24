import type { WeatherNow } from "@/lib/types";
import { getJson } from "./http";

export function getWeatherNow(townId: string): Promise<WeatherNow> {
  return getJson(`/api/weather?town=${encodeURIComponent(townId)}`);
}
