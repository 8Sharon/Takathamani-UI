import { useState, useEffect } from "react";
import type { Listing } from "./types";
import { syncFarmerNameAcrossMessages } from "./messages-store";

const FARMER_ACCOUNT_KEY = "takathamani_active_farmer_account_v1";
const LISTING_FARMERS_MAP_KEY = "takathamani_listing_farmers_map_v1";

export interface StoredFarmerAccount {
  id: string;
  full_name: string;
  phone: string;
  county: string;
  updated_at: string;
}

/**
 * Retrieve the active farmer account saved on this browser/client.
 */
export function getStoredFarmerAccount(): StoredFarmerAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FARMER_ACCOUNT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save or update the active farmer account details and propagate
 * the name to all farmer-originated messages.
 */
export function saveStoredFarmerAccount(profile: {
  id?: string | undefined;
  full_name?: string | undefined;
  phone?: string | undefined;
  county?: string | undefined;
}): void {
  if (typeof window === "undefined") return;
  if (!profile.full_name || profile.full_name.trim() === "New User") return;

  const current = getStoredFarmerAccount();
  const updated: StoredFarmerAccount = {
    id: profile.id || current?.id || "",
    full_name: profile.full_name.trim(),
    phone: profile.phone?.trim() || current?.phone || "",
    county: profile.county?.trim() || current?.county || "",
    updated_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem(FARMER_ACCOUNT_KEY, JSON.stringify(updated));
    // Immediately propagate the farmer's current name to all messages from the farmer
    syncFarmerNameAcrossMessages(updated.full_name, updated.phone);
    window.dispatchEvent(new CustomEvent("takathamani:farmer_updated", { detail: updated }));
  } catch (e) {
    console.warn("Could not save farmer account:", e);
  }
}

/**
 * Store an association between a listing ID and the farmer who created it.
 */
export function associateListingWithFarmer(
  listingId: string,
  farmer: { full_name: string; phone?: string | undefined; county?: string | undefined }
): void {
  if (typeof window === "undefined" || !listingId) return;
  try {
    const raw = localStorage.getItem(LISTING_FARMERS_MAP_KEY);
    const map: Record<string, { full_name: string; phone?: string | undefined; county?: string | undefined }> = raw
      ? JSON.parse(raw)
      : {};
    map[listingId] = {
      full_name: farmer.full_name.trim(),
      phone: farmer.phone ? farmer.phone.trim() : undefined,
      county: farmer.county ? farmer.county.trim() : undefined,
    };
    localStorage.setItem(LISTING_FARMERS_MAP_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("takathamani:farmer_updated"));
  } catch (e) {
    console.warn("Could not associate listing with farmer:", e);
  }
}

export function getListingFarmerMap(): Record<string, { full_name: string; phone?: string | undefined; county?: string | undefined }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LISTING_FARMERS_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Determine the farmer's display name and contact phone for a listing.
 * Prioritizes:
 * 1. listing.farmer_name (if set and not generic)
 * 2. Explicit listing-to-farmer mapping
 * 3. Active farmer account on this device if it is a user-created listing
 * 4. Active farmer account if present
 * 5. Fallback to clean title (never "Farmer (Taita Outgrower)")
 */
export function resolveFarmerForListing(
  listing: Listing,
  activeFarmer?: StoredFarmerAccount | null
): { name: string; phone: string } {
  const map = getListingFarmerMap();
  const mapped = map[listing.id];

  const current = activeFarmer ?? getStoredFarmerAccount();

  // 1. If explicit mapping exists
  if (mapped?.full_name) {
    return {
      name: mapped.full_name,
      phone: mapped.phone || listing.farmer_phone || "+254 721 345678",
    };
  }

  // 2. If listing.farmer_name is set
  if (listing.farmer_name && !listing.farmer_name.includes("Outgrower")) {
    return {
      name: listing.farmer_name,
      phone: listing.farmer_phone || "+254 721 345678",
    };
  }

  // 3. If listing is user-created (not seed starting with "fl-") and we have an active farmer account
  const isUserCreated = !listing.id.startsWith("fl-");
  if (isUserCreated && current?.full_name) {
    return {
      name: current.full_name,
      phone: current.phone || listing.farmer_phone || "+254 721 345678",
    };
  }

  // 4. If current farmer is available
  if (current?.full_name) {
    return {
      name: current.full_name,
      phone: current.phone || listing.farmer_phone || "+254 721 345678",
    };
  }

  // 5. Fallback clean name without "Outgrower"
  return {
    name: listing.farmer_name || `Farmer ${listing.county ? `(${listing.county})` : ""}`,
    phone: listing.farmer_phone || "+254 721 345678",
  };
}

/**
 * React hook for components to subscribe to active farmer account changes.
 */
export function useActiveFarmerAccount(): StoredFarmerAccount | null {
  const [account, setAccount] = useState<StoredFarmerAccount | null>(getStoredFarmerAccount());

  useEffect(() => {
    function load() {
      setAccount(getStoredFarmerAccount());
    }

    load();
    window.addEventListener("takathamani:farmer_updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("takathamani:farmer_updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return account;
}
