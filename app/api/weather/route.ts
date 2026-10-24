import type { NextRequest } from "next/server";
import { z } from "zod";
import { findTown } from "@/lib/providers/risk";
import type { WeatherNow } from "@/lib/types";

const OpenMeteo = z.object({ current: z.object({ temperature_2m: z.number(), weather_code: z.number() }) });

// GET /api/weather?town=amherst -> WeatherNow (right now, from Open-Meteo: free, no key). Cached for 10 minutes.
export async function GET(request: NextRequest) {
  const town = findTown(request.nextUrl.searchParams.get("town") ?? "");
  if (!town) return Response.json({ error: "That isn't a Massachusetts city or town" }, { status: 404 });

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${town.lat}&longitude=${town.lng}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
  const res = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(5000) }).catch(() => null);
  const parsed = OpenMeteo.safeParse(res?.ok ? await res.json().catch(() => null) : null);
  if (!parsed.success) return Response.json({ error: "Weather isn't available right now" }, { status: 502 });

  const { temperature_2m, weather_code } = parsed.data.current;
  const weather: WeatherNow = {
    townId: town.id,
    tempF: Math.round(temperature_2m),
    sky: sky(weather_code),
    source: { name: "Open-Meteo: current weather", url: "https://open-meteo.com/" },
  };
  return Response.json(weather);
}

// WMO weather codes: https://open-meteo.com/en/docs
function sky(code: number) {
  if (code >= 95) return "Thunderstorms";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snow";
  if (code >= 51) return "Rain";
  if (code === 45 || code === 48) return "Fog";
  if (code === 3) return "Cloudy";
  return code === 0 ? "Clear" : "Partly cloudy";
}
