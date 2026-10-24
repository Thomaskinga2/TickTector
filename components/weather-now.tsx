"use client";

import { useCite } from "@/components/sources";
import { getWeatherNow } from "@/lib/services/weather";
import { useAsync } from "@/lib/use-async";

// "59°F · Clear" on its own line under the town page's date, like Apple Weather. Shows nothing until it loads, or if it can't.
export function WeatherNow({ townId }: { townId: string }) {
  const { data: weather } = useAsync(() => getWeatherNow(townId), [townId]);
  useCite(weather ? [weather.source] : undefined);
  if (!weather) return null;
  return (
    <span className="block">
      {weather.tempF}°F · {weather.sky}
    </span>
  );
}
