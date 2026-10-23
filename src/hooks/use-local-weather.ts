import { useEffect, useMemo, useState } from "react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { countyCoords, DEFAULT_COUNTY } from "@/lib/kenya-counties";
import { reverseGeocode, type LatLng } from "@/lib/geo";

export interface WeatherDay {
  day: string;
  hi: number;
  lo: number;
  code: number;
}

export interface LocalWeather {
  place: string;
  temp: number;
  code: number;
  label: string;
  days: WeatherDay[];
  coords: LatLng | null;
  loading: boolean;
  denied: boolean;
}

export function weatherLabel(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "Rain showers";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 95) return "Thunderstorm";
  return "Mild";
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface OpenMeteoResponse {
  current?: { temperature_2m?: number; weather_code?: number };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
}

/**
 * Resolves the device's real location (with permission), reverse geocodes it into a
 * place name and pulls the live forecast for those exact coordinates.
 * Falls back to the user's county (or Nakuru) when location access is unavailable.
 */
export function useLocalWeather(fallbackCounty?: string): LocalWeather {
  const geolocation = useGeolocation();
  const [place, setPlace] = useState("");
  const [temp, setTemp] = useState<number | null>(null);
  const [code, setCode] = useState<number | null>(null);
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);

  const coords = useMemo<LatLng>(() => {
    if (geolocation.coords) return geolocation.coords;
    return countyCoords(fallbackCounty ?? "") ?? DEFAULT_COUNTY;
  }, [geolocation.coords, fallbackCounty]);

  const resolvedFromDevice = geolocation.coords !== null;
  const denied = geolocation.denied && geolocation.coords === null;

  useEffect(() => {
    if (geolocation.loading) return;
    let cancelled = false;

    async function load() {
      const target = coords;
      const [placeName, weather] = await Promise.all([
        resolvedFromDevice
          ? reverseGeocode(target.lat, target.lng)
          : Promise.resolve(fallbackCounty ? `${fallbackCounty} County` : ""),
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${target.lat}&longitude=${target.lng}` +
            `&current=temperature_2m,weather_code` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
            `&timezone=auto&forecast_days=4`,
        ).then((r) => (r.ok ? (r.json() as Promise<OpenMeteoResponse>) : null)),
      ]);

      if (cancelled) return;

      if (weather?.current) {
        setTemp(weather.current.temperature_2m ?? null);
        setCode(weather.current.weather_code ?? 0);
      }
      const d = weather?.daily;
      if (d?.time?.length) {
        setDays(
          d.time.slice(0, 4).map((iso, i) => {
            const date = new Date(`${iso}T12:00:00`);
            return {
              day: i === 0 ? "Today" : (DAY_NAMES[date.getDay()] ?? "Today"),
              hi: Math.round(d.temperature_2m_max?.[i] ?? 0),
              lo: Math.round(d.temperature_2m_min?.[i] ?? 0),
              code: d.weather_code?.[i] ?? 0,
            };
          }),
        );
      }
      setPlace(placeName || (resolvedFromDevice ? "Your location" : `${DEFAULT_COUNTY.name} County`));
      setLoading(false);
    }

    load().catch(() => {
      if (cancelled) return;
      setPlace((p) => p || (fallbackCounty ? `${fallbackCounty} County` : DEFAULT_COUNTY.name));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [coords, resolvedFromDevice, geolocation.loading, fallbackCounty]);

  return {
    place,
    temp: temp ?? 0,
    code: code ?? 0,
    label: code === null ? "" : weatherLabel(code),
    days,
    coords: geolocation.coords ?? coords,
    loading,
    denied,
  };
}
