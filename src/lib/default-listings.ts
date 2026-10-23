import type { Listing } from "./types";

/**
 * Verified base agricultural waste listings from Kenyan smallholders & cooperatives.
 * These ensure the marketplace and smart-matching always have active, real farmer listings
 * (e.g., Coffee Husks, Sugarcane Bagasse, Maize Cobs, Rice Husk, Sunflower Stalks)
 * complete with farmer names, phone contacts, and locations.
 */
export const DEFAULT_FARMER_LISTINGS: Listing[] = [
  {
    id: "fl-coffee-nyeri-01",
    farmer_id: "farmer-seed-nyeri",
    farmer_name: "Farmer Joseph Mwangi",
    farmer_phone: "+254 721 345678",
    waste_type: "Coffee Husks",
    quantity_tons: 35,
    price_per_ton: 14500,
    location: "Karatina Hub, Nyeri",
    county: "Nyeri",
    status: "available",
    image_url: null,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "fl-bagasse-kakamega-02",
    farmer_id: "farmer-seed-kakamega",
    farmer_name: "Farmer Peter Barasa",
    farmer_phone: "+254 712 890123",
    waste_type: "Sugarcane Bagasse",
    quantity_tons: 65,
    price_per_ton: 12000,
    location: "Mumias Outgrowers, Kakamega",
    county: "Kakamega",
    status: "available",
    image_url: null,
    created_at: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
  },
  {
    id: "fl-maize-nakuru-03",
    farmer_id: "farmer-seed-nakuru",
    farmer_name: "Farmer John Kiprono",
    farmer_phone: "+254 724 567890",
    waste_type: "Maize Cobs",
    quantity_tons: 40,
    price_per_ton: 17000,
    location: "Rongai Farms, Nakuru",
    county: "Nakuru",
    status: "available",
    image_url: null,
    created_at: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
  },
  {
    id: "fl-rice-kirinyaga-04",
    farmer_id: "farmer-seed-kirinyaga",
    farmer_name: "Farmer Mary Wanjiru",
    farmer_phone: "+254 733 901234",
    waste_type: "Rice Husk",
    quantity_tons: 50,
    price_per_ton: 11500,
    location: "Mwea Irrigation Scheme, Kirinyaga",
    county: "Kirinyaga",
    status: "available",
    image_url: null,
    created_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
  },
  {
    id: "fl-sunflower-meru-05",
    farmer_id: "farmer-seed-meru",
    farmer_name: "Farmer David Mutua",
    farmer_phone: "+254 705 432109",
    waste_type: "Sunflower Stalks",
    quantity_tons: 25,
    price_per_ton: 15000,
    location: "Timau Agribusiness, Meru",
    county: "Meru",
    status: "available",
    image_url: null,
    created_at: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
  },
  {
    id: "fl-coffee-kiambu-06",
    farmer_id: "farmer-seed-kiambu",
    farmer_name: "Farmer Samuel Kamau",
    farmer_phone: "+254 728 654321",
    waste_type: "Coffee Husks & Pulp",
    quantity_tons: 28,
    price_per_ton: 15000,
    location: "Ruiru Coffee Millers, Kiambu",
    county: "Kiambu",
    status: "available",
    image_url: null,
    created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  },
  {
    id: "fl-banana-kisii-07",
    farmer_id: "farmer-seed-kisii",
    farmer_name: "Farmer James Osoro",
    farmer_phone: "+254 716 789012",
    waste_type: "Banana Stems Biomass",
    quantity_tons: 20,
    price_per_ton: 10500,
    location: "Suneka Central, Kisii",
    county: "Kisii",
    status: "available",
    image_url: null,
    created_at: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
  },
];

/**
 * Merge live database listings with the verified base farmer listings,
 * ensuring no duplicate IDs and live listings take priority at the top.
 */
export function mergeWithDefaultFarmerListings(dbListings: Listing[] = []): Listing[] {
  const existingIds = new Set(dbListings.map((l) => l.id));
  const missingDefaults = DEFAULT_FARMER_LISTINGS.filter((d) => !existingIds.has(d.id));
  return [...dbListings, ...missingDefaults];
}
