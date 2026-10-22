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

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardData> => {
    const { supabase, userId } = context;

    const [profileRes, roleRes, listingsRes, txRes, msgRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase
        .from("listings")
        .select("*")
        .eq("farmer_id", userId)
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

    return {
      profile,
      role: roleRes.data?.role ?? "farmer",
      listings: (listingsRes.data ?? []) as Listing[],
      transactions: (txRes.data ?? []) as Transaction[],
      unreadMessages: msgRes.data?.length ?? 0,
    };
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
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: listing, error } = await context.supabase
      .from("listings")
      .insert({ ...data, farmer_id: context.userId, status: "available" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return listing as Listing;
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
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
