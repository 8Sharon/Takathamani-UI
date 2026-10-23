export interface County {
  name: string;
  lat: number;
  lng: number;
}

export const KENYA_COUNTIES: County[] = [
  { name: "Baringo", lat: 0.9, lng: 36.0 },
  { name: "Bomet", lat: -0.78, lng: 35.34 },
  { name: "Bungoma", lat: 0.57, lng: 34.56 },
  { name: "Busia", lat: 0.46, lng: 34.11 },
  { name: "Elgeyo-Marakwet", lat: 0.85, lng: 35.4 },
  { name: "Embu", lat: -0.55, lng: 37.45 },
  { name: "Garissa", lat: -0.45, lng: 39.64 },
  { name: "Homa Bay", lat: -0.53, lng: 34.46 },
  { name: "Isiolo", lat: 0.35, lng: 37.58 },
  { name: "Kajiado", lat: -2.1, lng: 36.8 },
  { name: "Kakamega", lat: 0.28, lng: 34.75 },
  { name: "Kericho", lat: -0.37, lng: 35.29 },
  { name: "Kiambu", lat: -1.03, lng: 36.87 },
  { name: "Kilifi", lat: -3.63, lng: 39.85 },
  { name: "Kirinyaga", lat: -0.5, lng: 37.28 },
  { name: "Kisii", lat: -0.68, lng: 34.77 },
  { name: "Kisumu", lat: -0.1, lng: 34.75 },
  { name: "Kitui", lat: -1.37, lng: 38.01 },
  { name: "Kwale", lat: -4.18, lng: 39.45 },
  { name: "Laikipia", lat: 0.4, lng: 36.8 },
  { name: "Lamu", lat: -2.27, lng: 40.9 },
  { name: "Machakos", lat: -1.55, lng: 37.26 },
  { name: "Makueni", lat: -2.25, lng: 37.9 },
  { name: "Mandera", lat: 3.94, lng: 41.86 },
  { name: "Marsabit", lat: 2.33, lng: 37.99 },
  { name: "Meru", lat: 0.05, lng: 37.66 },
  { name: "Migori", lat: -1.06, lng: 34.47 },
  { name: "Mombasa", lat: -4.05, lng: 39.66 },
  { name: "Murang'a", lat: -0.77, lng: 37.15 },
  { name: "Nairobi City", lat: -1.2921, lng: 36.8219 },
  { name: "Nakuru", lat: -0.3032, lng: 36.0801 },
  { name: "Nandi", lat: 0.18, lng: 35.1 },
  { name: "Narok", lat: -1.1, lng: 36.0 },
  { name: "Nyamira", lat: -0.56, lng: 34.94 },
  { name: "Nyandarua", lat: -0.42, lng: 36.52 },
  { name: "Nyeri", lat: -0.42, lng: 36.95 },
  { name: "Samburu", lat: 1.5, lng: 36.8 },
  { name: "Siaya", lat: 0.06, lng: 34.29 },
  { name: "Taita-Taveta", lat: -3.4, lng: 38.4 },
  { name: "Tana River", lat: -1.9, lng: 40.0 },
  { name: "Tharaka-Nithi", lat: -0.3, lng: 37.7 },
  { name: "Trans Nzoia", lat: 1.05, lng: 35.0 },
  { name: "Turkana", lat: 3.4, lng: 35.7 },
  { name: "Uasin Gishu", lat: 0.52, lng: 35.27 },
  { name: "Vihiga", lat: 0.07, lng: 34.7 },
  { name: "Wajir", lat: 1.75, lng: 40.06 },
  { name: "West Pokot", lat: 1.62, lng: 35.3 },
];

export const COUNTY_NAMES: string[] = KENYA_COUNTIES.map((c) => c.name);

export const DEFAULT_COUNTY: County =
  KENYA_COUNTIES.find((c) => c.name === "Nakuru") ?? (KENYA_COUNTIES[0] as County);

export function countyCoords(name: string): County | null {
  if (!name) return null;
  const raw = name.trim().toLowerCase().replace(/\s+county$/, "");
  const normalized = raw.replace(/['’]/g, "").replace(/[\s-]+/g, " ");
  if (!normalized) return null;

  return (
    KENYA_COUNTIES.find((c) => {
      const cNorm = c.name.toLowerCase().replace(/['’]/g, "").replace(/[\s-]+/g, " ");
      return cNorm === normalized;
    }) ??
    KENYA_COUNTIES.find((c) => {
      const cNorm = c.name.toLowerCase().replace(/['’]/g, "").replace(/[\s-]+/g, " ");
      return cNorm.startsWith(normalized) || normalized.startsWith(cNorm);
    }) ??
    KENYA_COUNTIES.find((c) => {
      const cNorm = c.name.toLowerCase().replace(/['’]/g, "").replace(/[\s-]+/g, " ");
      return cNorm.includes(normalized) || normalized.includes(cNorm);
    }) ??
    null
  );
}
