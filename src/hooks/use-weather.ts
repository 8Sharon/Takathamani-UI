import { useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo";

export interface WeatherData {
  temperature: number; // °C
  weatherCode: number; // WMO weather code
  placeName: string;
  loading: boolean;
  error: boolean;
}

/** Maps WMO weather codes to human-readable descriptions */
function describeWeather(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 9) return "Foggy";
  if (code <= 19) return "Drizzle";
  if (code <= 29) return "Rain";
  if (code <= 39) return "Snow";
  if (code <= 49) return "Fog";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 84) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

export { describeWeather };

/** Reverse-geocode coordinates to a place name using Open Street Map Nominatim */
async function reversegeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) throw new Error("geocode failed");
    const data = await res.json();
    // Try suburb, town, city, county, state in order
    const a = data.address ?? {};
    return (
      a.suburb ??
      a.neighbourhood ??
      a.village ??
      a.town ??
      a.city ??
      a.county ??
      a.state ??
      data.display_name?.split(",")[0] ??
      "Your Location"
    );
  } catch {
    return "Your Location";
  }
}

/** Fetch current weather from Open-Meteo (free, no API key) */
async function fetchWeather(
  lat: number,
  lng: number,
): Promise<{ temperature: number; weatherCode: number }> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  const data = await res.json();
  return {
    temperature: Math.round(data.current.temperature_2m),
    weatherCode: data.current.weather_code,
  };
}

/**
 * Hook that returns real-time weather + place name for the given coordinates.
 * Coordinates are optional; if null the hook stays in loading state.
 */
export function useWeather(coords: LatLng | null): WeatherData {
  const [state, setState] = useState<WeatherData>({
    temperature: 0,
    weatherCode: 0,
    placeName: "—",
    loading: true,
    error: false,
  });

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;

    (async () => {
      try {
        const [weather, place] = await Promise.all([
          fetchWeather(coords.lat, coords.lng),
          reversegeocode(coords.lat, coords.lng),
        ]);
        if (!cancelled) {
          setState({
            temperature: weather.temperature,
            weatherCode: weather.weatherCode,
            placeName: place,
            loading: false,
            error: false,
          });
        }
      } catch {
        if (!cancelled)
          setState((s) => ({ ...s, loading: false, error: true }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coords?.lat, coords?.lng]);

  return state;
}
