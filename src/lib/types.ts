export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  county: string;
  verified: boolean;
  avatar_url: string | null;
}

export interface Buyer {
  id: string;
  company_name: string;
  producer_type: string;
  buys: string[];
  location: string;
  county: string;
  price_min: number;
  price_max: number;
  verified: boolean;
  rating: number;
  reviews: number;
}

export interface BuyerDemand {
  id: string;
  buyer_id: string;
  buyer_name: string;
  company_name: string;
  phone: string;
  waste_type: string;
  quantity_tons: number;
  price_per_ton: number;
  county: string;
  location: string;
  notes?: string | undefined;
  created_at: string;
  status: "active" | "matched" | "fulfilled";
  from_farmer_listing_id?: string | undefined;
  image_url?: string | null | undefined;
}

export interface Listing {
  id: string;
  farmer_id: string;
  farmer_name?: string | undefined;
  farmer_phone?: string | undefined;
  waste_type: string;
  quantity_tons: number;
  price_per_ton: number;
  location: string;
  county: string;
  status: "available" | "pending" | "sold";
  image_url: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  farmer_id: string;
  buyer_id: string | null;
  waste_type: string;
  tons: number;
  amount: number;
  status: "pending" | "completed" | "failed";
  counterparty: string;
  paid_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  user_id?: string | undefined;
  sender: string;
  sender_role?: "buyer" | "farmer" | "system" | undefined;
  recipient_role?: "buyer" | "farmer" | undefined;
  sender_phone?: string | undefined;
  sender_id?: string | undefined;
  recipient_id?: string | undefined;
  listing_id?: string | undefined;
  listing_title?: string | undefined;
  listing_details?: string | undefined;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
  reply_to_id?: string | undefined;
}

export interface ImpactStats {
  id: number;
  total_recovered_tons: number;
  co2_avoided_tons: number;
  trees_equivalent: number;
  farmers_benefited: number;
  jobs_created: number;
  breakdown: Record<string, number>;
}

export interface DashboardData {
  profile: Profile;
  role: string;
  listings: Listing[];
  allListings: Listing[];
  transactions: Transaction[];
  unreadMessages: number;
}

export const WASTE_TYPES = [
  "Maize Cobs",
  "Rice Husk",
  "Sugarcane Bagasse",
  "Sunflower Stalks",
  "Wheat Straw",
  "Coffee Husks",
  "Other",
] as const;

export function formatKsh(value: number): string {
  return `KSh ${value.toLocaleString("en-KE")}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1)  return "just now";
  if (mins  < 60)  return `${mins} min${mins === 1 ? "" : "s"} ago`;
  if (hours < 24)  return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  if (days  === 1) return "yesterday";
  return `${days} days ago`;
}

export function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function editDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  let prev: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  const curr: number[] = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        curr[j] = prev[j - 1] ?? 0;
      } else {
        const pDiag = prev[j - 1] ?? 0;
        const pUp = prev[j] ?? 0;
        const cLeft = curr[j - 1] ?? 0;
        curr[j] = Math.min(pDiag, pUp, cLeft) + 1;
      }
    }
    prev = [...curr];
  }
  return prev[n] ?? 0;
}

export function wasteTypesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const na = a.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
  const nb = b.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();

  // Exact or substring match (e.g. "coffee" inside "coffee husks" or vice versa)
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;

  // Word tokens check
  const wordsA = na.split(/\s+/).filter((w) => w.length >= 3);
  const wordsB = nb.split(/\s+/).filter((w) => w.length >= 3);

  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wa === wb) return true;
      // Substring check between tokens (e.g. "bagasse" in "sugarbagasse")
      if (wa.includes(wb) || wb.includes(wa)) return true;
      // Prefix matching (e.g. "sugar" <-> "sugarcane")
      if (wa.length >= 4 && wb.length >= 4 && (wa.startsWith(wb) || wb.startsWith(wa))) {
        return true;
      }
      // Typo tolerance (e.g. "coffe" <-> "coffee", "baggase" <-> "bagasse")
      if (wa.length >= 4 && wb.length >= 4) {
        const dist = editDistance(wa, wb);
        if (dist <= 1) return true;
        if (Math.max(wa.length, wb.length) >= 7 && dist <= 2) return true;
      }
    }
  }
  return false;
}

