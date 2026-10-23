export interface LatLng {
  lat: number;
  lng: number;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistance(km: number): string {
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function seedFrom(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Stable jitter inside a county so repeat visits pin the same spot. */
export function pointForId(base: LatLng, id: string): LatLng {
  const seed = seedFrom(id);
  const angle = (seed % 360) * (Math.PI / 180);
  const radius = 0.04 + ((seed >> 3) % 100) / 2500;
  return {
    lat: base.lat + Math.cos(angle) * radius,
    lng: base.lng + Math.sin(angle) * radius,
  };
}

const NOMINATIM = "https://nominatim.openstreetmap.org";

export async function reverseGeocode(lat: number, lng: number, language = "en"): Promise<string> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${language}`;
    const res = await fetch(url);
    if (res.ok) {
      const j = (await res.json()) as Record<string, string | undefined>;
      const parts = [j["city"] || j["locality"], j["principalSubdivision"]].filter(Boolean) as string[];
      if (parts.length) return parts.join(", ");
    }
  } catch {
    /* fall through to Nominatim */
  }
  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lng}&accept-language=${language}`,
    );
    if (res.ok) {
      const j = (await res.json()) as { address?: Record<string, string> };
      const a = j.address ?? {};
      const parts = [a["city"] || a["town"] || a["village"] || a["county"], a["state"]].filter(Boolean) as string[];
      if (parts.length) return parts.join(", ");
    }
  } catch {
    /* ignore */
  }
  return "";
}
