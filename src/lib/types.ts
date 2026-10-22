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

export interface Listing {
  id: string;
  farmer_id: string;
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
  sender: string;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
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
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
