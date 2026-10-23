import { useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo";

interface GeolocationState {
  coords: LatLng | null;
  /** true while the browser is still resolving the first fix */
  loading: boolean;
  /** true when permission was denied or no position is available */
  denied: boolean;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({ coords: null, loading: true, denied: false });

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ coords: null, loading: false, denied: true });
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) setState((s) => ({ ...s, loading: false, denied: s.coords === null }));
    }, 10_000);

    const id = navigator.geolocation.getCurrentPosition(
      (pos) => {
        settled = true;
        clearTimeout(timer);
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          loading: false,
          denied: false,
        });
      },
      () => {
        settled = true;
        clearTimeout(timer);
        setState({ coords: null, loading: false, denied: true });
      },
      { enableHighAccuracy: false, timeout: 9_000, maximumAge: 5 * 60_000 },
    );

    return () => {
      settled = true;
      clearTimeout(timer);
      if (typeof id === "number" && "clearWatch" in navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(id);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return state;
}
