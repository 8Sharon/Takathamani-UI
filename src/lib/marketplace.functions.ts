import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  Buyer,
  DashboardData,
  ImpactStats,
  Listing,
  Message,
  Profile,
  Transaction,
} from "./types";
import { mergeWithDefaultFarmerListings } from "./default-listings";

export function attachFarmerMeta(
  imageUrl: string | null | undefined,
  meta: { farmer_name?: string | undefined; farmer_phone?: string | undefined }
): string | null {
  if (!imageUrl && !meta.farmer_name) return null;
  const base = imageUrl ? imageUrl.split("#")[0] : "";
  const params = new URLSearchParams();
  if (meta.farmer_name) params.set("fn", meta.farmer_name);
  if (meta.farmer_phone) params.set("fp", meta.farmer_phone);
  const hash = params.toString();
  if (!hash) return imageUrl || null;
  return base ? `${base}#${hash}` : `#${hash}`;
}

export function extractFarmerMeta(imageUrl: string | null | undefined): {
  farmer_name?: string | undefined;
  farmer_phone?: string | undefined;
  cleanImageUrl: string | null;
} {
  if (!imageUrl) return { cleanImageUrl: null };
  const parts = imageUrl.split("#");
  const clean = parts[0] || null;
  const hash = parts[1];
  if (!hash) return { cleanImageUrl: clean };
  try {
    const params = new URLSearchParams(hash);
    return {
      farmer_name: params.get("fn") || undefined,
      farmer_phone: params.get("fp") || undefined,
      cleanImageUrl: clean,
    };
  } catch {
    return { cleanImageUrl: clean };
  }
}

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardData> => {
    const { supabase, userId } = context;

    const [profileRes, roleRes, listingsRes, allListingsRes, txRes, msgRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase
        .from("listings")
        .select("*")
        .eq("farmer_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("*")
        .eq("farmer_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("*")
        .eq("user_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false }),
    ]);

    const profile: Profile = profileRes.data ?? {
      id: userId,
      full_name: "New User",
      phone: "",
      county: "",
      verified: false,
      avatar_url: null,
    };

    const userListings = (listingsRes.data ?? []) as Listing[];
    const allDbListings = (allListingsRes.data ?? []) as Listing[];

    const enrichedAllDbListings = allDbListings.map((l) => {
      const meta = extractFarmerMeta(l.image_url);
      return {
        ...l,
        image_url: meta.cleanImageUrl ?? l.image_url,
        farmer_name: l.farmer_name || meta.farmer_name || (l.farmer_id === userId ? profile.full_name : undefined),
        farmer_phone: l.farmer_phone || meta.farmer_phone || (l.farmer_id === userId ? profile.phone : undefined),
      };
    });

    return {
      profile,
      role: roleRes.data?.role ?? "farmer",
      listings: userListings,
      allListings: mergeWithDefaultFarmerListings(enrichedAllDbListings),
      transactions: (txRes.data ?? []) as Transaction[],
      unreadMessages: msgRes.data?.length ?? 0,
    };
  });

export const getAllListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Listing[]> => {
    const { data } = await context.supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    const rawListings = (data ?? []) as Listing[];
    const enriched = rawListings.map((l) => {
      const meta = extractFarmerMeta(l.image_url);
      return {
        ...l,
        image_url: meta.cleanImageUrl ?? l.image_url,
        farmer_name: l.farmer_name || meta.farmer_name || undefined,
        farmer_phone: l.farmer_phone || meta.farmer_phone || undefined,
      };
    });

    return mergeWithDefaultFarmerListings(enriched);
  });

export const getBuyers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Buyer[]> => {
    const { data } = await context.supabase.from("buyers").select("*").order("rating", { ascending: false });
    return (data ?? []) as Buyer[];
  });

export const getImpact = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ImpactStats> => {
    const { data } = await context.supabase.from("impact_stats").select("*").eq("id", 1).maybeSingle();
    return (
      (data as ImpactStats) ?? {
        id: 1,
        total_recovered_tons: 0,
        co2_avoided_tons: 0,
        trees_equivalent: 0,
        farmers_benefited: 0,
        jobs_created: 0,
        breakdown: {},
      }
    );
  });

export const getMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Message[]> => {
    const { data } = await context.supabase
      .from("messages")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return (data ?? []) as Message[];
  });

export const markMessageRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await context.supabase.from("messages").update({ read: true }).eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        waste_type: z.string().min(1),
        quantity_tons: z.coerce.number().positive(),
        price_per_ton: z.coerce.number().int().positive(),
        location: z.string().min(1),
        county: z.string().min(1),
        image_url: z.string().url().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    // Fetch the farmer's profile to store their name and phone on the listing
    const profileRes = await context.supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", context.userId)
      .maybeSingle();
    const farmerName = profileRes.data?.full_name || undefined;
    const farmerPhone = profileRes.data?.phone || undefined;

    const finalImageUrl = attachFarmerMeta(data.image_url, {
      farmer_name: farmerName,
      farmer_phone: farmerPhone,
    });

    const insertPayload = {
      farmer_id: context.userId,
      status: "available" as const,
      waste_type: data.waste_type,
      quantity_tons: data.quantity_tons,
      price_per_ton: data.price_per_ton,
      location: data.location,
      county: data.county,
      image_url: finalImageUrl,
      ...(farmerName ? { farmer_name: farmerName } : {}),
      ...(farmerPhone ? { farmer_phone: farmerPhone } : {}),
    };

    const { data: listing, error } = await context.supabase
      .from("listings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insertPayload as any)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const meta = extractFarmerMeta(listing.image_url);
    const enrichedListing: Listing = {
      ...(listing as Listing),
      image_url: meta.cleanImageUrl ?? listing.image_url,
      farmer_name: meta.farmer_name || farmerName,
      farmer_phone: meta.farmer_phone || farmerPhone,
    };
    return enrichedListing;
  });

export const deleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("listings")
      .delete()
      .eq("id", data.id)
      .eq("farmer_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        full_name: z.string().min(1).optional(),
        phone: z.string().optional(),
        county: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    type ProfileUpdate = {
      full_name?: string;
      phone?: string;
      county?: string;
    };
    const payload: ProfileUpdate = {};
    if (data.full_name !== undefined) payload.full_name = data.full_name;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.county !== undefined) payload.county = data.county;
    const { error } = await context.supabase.from("profiles").update(payload).eq("id", context.userId);
    if (error) throw new Error(error.message);

    // Sync all listings created by this farmer to store the updated farmer name and phone
    try {
      const { data: farmerListings } = await context.supabase
        .from("listings")
        .select("id, image_url")
        .eq("farmer_id", context.userId);

      if (farmerListings && farmerListings.length > 0) {
        for (const fl of farmerListings) {
          const updatedImg = attachFarmerMeta(fl.image_url, {
            farmer_name: data.full_name,
            farmer_phone: data.phone,
          });
          await context.supabase
            .from("listings")
            .update({ image_url: updatedImg })
            .eq("id", fl.id)
            .eq("farmer_id", context.userId);
        }
      }
    } catch (syncErr) {
      console.warn("Could not sync farmer listings image_url:", syncErr);
    }

    return { ok: true };
  });
