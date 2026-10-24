import type { NextRequest } from "next/server";
import { z } from "zod";
import { isDemoMode, WEATHER } from "@/lib/mock-data";
import { findTown } from "@/lib/risk-model";
import type { Weather } from "@/lib/types";

const OpenMeteo = z.object({
  current: z.object({ temperature_2m: z.number(), relative_humidity_2m: z.number(), weather_code: z.number() }),
});

// GET /api/weather?town=amherst -> Weather (right now, from Open-Meteo: free, no key)
// ponytail: no cache, one Open-Meteo call per page view (free tier: 10k/day); add fetch revalidate if traffic grows.
export async function GET(request: NextRequest) {
  const townId = request.nextUrl.searchParams.get("town") ?? "";
  if (isDemoMode()) return Response.json({ ...WEATHER, townId });
  const town = findTown(townId);
  if (!town) return Response.json({ error: "We couldn't find that Massachusetts town" }, { status: 404 });

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${town.lat}&longitude=${town.lng}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=fahrenheit`;
  const res = await fetch(url).catch(() => null);
  const parsed = OpenMeteo.safeParse(res?.ok ? await res.json().catch(() => null) : null);
  if (!parsed.success) return Response.json({ error: "Weather isn't available right now" }, { status: 502 });

  const { temperature_2m, relative_humidity_2m: humidity, weather_code } = parsed.data.current;
  return Response.json(describe(town.id, Math.round(temperature_2m), humidity, weather_code));
}

// WMO weather codes: https://open-meteo.com/en/docs
function sky(code: number) {
  if (code >= 95) return "stormy";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snowy";
  if (code >= 51) return "rainy";
  if (code === 45 || code === 48) return "foggy";
  if (code === 3) return "cloudy";
  return code === 0 ? "clear" : "partly cloudy";
}

function describe(townId: string, tempF: number, humidity: number, code: number): Weather {
  const feel = humidity >= 80 ? "very humid" : humidity >= 60 ? "humid" : humidity < 35 ? "dry" : null;
  const words = [feel, sky(code)].filter(Boolean).join(" and ");
  return {
    townId,
    summary: `Today is ${words}: ${tempF}°F with ${humidity}% humidity.`,
    // data/massgov/text/tickborne-disease-surveillance-report-2025.txt: adult ticks bite "any time temperatures are above freezing"
    ticks:
      tempF > 32
        ? "Ticks can bite today. Adult ticks are active any time it's above freezing."
        : "It's below freezing right now. Adult ticks come back out any time it's above freezing.",
  };
}
