import { useState, useEffect } from "react";
import type { BuyerDemand, Listing } from "./types";
import { resolveWasteImage } from "./waste-images";

const DEMANDS_STORAGE_KEY = "takathamani_buyer_demands_v1";

export const INITIAL_BUYER_DEMANDS: BuyerDemand[] = [
  {
    id: "demand-1",
    buyer_id: "seed-buyer-1",
    buyer_name: "Mwangi David",
    company_name: "GreenFuel Ltd",
    phone: "+254 722 100200",
    waste_type: "Maize Cobs",
    quantity_tons: 35,
    price_per_ton: 18500,
    county: "Nakuru",
    location: "Nakuru - Rongai Industrial",
    notes: "Needed urgently for briquette manufacturing. We can provide transport for >10 ton batches.",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: "active",
    image_url: null,
  },
  {
    id: "demand-2",
    buyer_id: "seed-buyer-2",
    buyer_name: "Grace Wanjiku",
    company_name: "Tanga Feeds & Millers",
    phone: "+254 733 456789",
    waste_type: "Sunflower Stalks",
    quantity_tons: 25,
    price_per_ton: 16500,
    county: "Nakuru",
    location: "Nakuru - Naka",
    notes: "High dry-matter content required for animal feed formulation. Immediate payment via M-Pesa.",
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    status: "active",
    image_url: null,
  },
  {
    id: "demand-3",
    buyer_id: "seed-buyer-3",
    buyer_name: "Brian Ochieng",
    company_name: "Kenya Biomass Energy",
    phone: "+254 711 987654",
    waste_type: "Sugarcane Bagasse",
    quantity_tons: 50,
    price_per_ton: 13000,
    county: "Kakamega",
    location: "Kakamega - Mumias Hub",
    notes: "Steam boiler fuel. Looking for long-term supply contract with Western region farmers.",
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    status: "active",
    image_url: null,
  },
  {
    id: "demand-4",
    buyer_id: "seed-buyer-4",
    buyer_name: "Esther Akinyi",
    company_name: "Ahero Briquettes Co.",
    phone: "+254 700 334455",
    waste_type: "Rice Husk",
    quantity_tons: 40,
    price_per_ton: 12500,
    county: "Kisumu",
    location: "Kisumu - Ahero Irrigation Scheme",
    notes: "Dry husks preferred. Immediate weighbridge inspection and fast mobile money release.",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: "active",
    image_url: null,
  },
  {
    id: "demand-5",
    buyer_id: "seed-buyer-5",
    buyer_name: "Kiptoo Korir",
    company_name: "Rift Biochar Solutions",
    phone: "+254 721 889900",
    waste_type: "Banana Stems & Leaves Biomass",
    quantity_tons: 20,
    price_per_ton: 11000,
    county: "Meru",
    location: "Meru - Nkubu Central",
    notes: "Pyrolysis grade banana pseudostem fiber for soil conditioner biochar.",
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    status: "active",
    image_url: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80",
  },
];

/** Read buyer demands from localStorage or return defaults */
export function getStoredBuyerDemands(): BuyerDemand[] {
  if (typeof window === "undefined") return INITIAL_BUYER_DEMANDS;
  try {
    const raw = localStorage.getItem(DEMANDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEMANDS_STORAGE_KEY, JSON.stringify(INITIAL_BUYER_DEMANDS));
      return INITIAL_BUYER_DEMANDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_BUYER_DEMANDS;
  } catch {
    return INITIAL_BUYER_DEMANDS;
  }
}

/** Create and persist a new buyer demand, notifying all listeners */
export function createBuyerDemand(
  input: Omit<BuyerDemand, "id" | "created_at" | "status"> & { status?: BuyerDemand["status"] }
): BuyerDemand {
  const current = getStoredBuyerDemands();
  const image_url = input.image_url || resolveWasteImage(input.waste_type).url;

  const newDemand: BuyerDemand = {
    id: `demand-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    image_url,
    status: input.status ?? "active",
    created_at: new Date().toISOString(),
  };

  const updated = [newDemand, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DEMANDS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("takathamani:demands_updated", { detail: newDemand }));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }
  return newDemand;
}

/** Delete a buyer demand by ID and notify listeners */
export function deleteBuyerDemand(id: string): void {
  const current = getStoredBuyerDemands();
  const updated = current.filter((d) => d.id !== id);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DEMANDS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("takathamani:demands_updated"));
    } catch (e) {
      console.warn("Could not delete from localStorage:", e);
    }
  }
}

/** React hook for real-time buyer demands subscription */
export function useBuyerDemands() {
  const [demands, setDemands] = useState<BuyerDemand[]>(() => getStoredBuyerDemands());

  useEffect(() => {
    function refresh() {
      setDemands(getStoredBuyerDemands());
    }

    refresh();
    window.addEventListener("takathamani:demands_updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("takathamani:demands_updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return demands;
}
