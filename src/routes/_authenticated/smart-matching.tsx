import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  Tag,
  MapPin,
  ShieldCheck,
  X,
  Star,
  BadgeCheck,
  ChevronLeft,
  Sparkles,
  Building2,
  PhoneCall,
  CheckCircle2,
  ShoppingBag,
  Package,
} from "lucide-react";
import { getBuyers, getDashboard, getAllListings } from "@/lib/marketplace.functions";
import type { Buyer, Listing, BuyerDemand } from "@/lib/types";
import { wasteTypesMatch } from "@/lib/types";
import { useBuyerDemands } from "@/lib/buyer-demands";
import { listingImage, resolveWasteImage } from "@/lib/waste-images";
import { AddBuyerDemandDialog } from "@/components/add-buyer-demand-dialog";

export const Route = createFileRoute("/_authenticated/smart-matching")({
  head: () => ({
    meta: [
      { title: "Smart Matching | Takathamani" },
      {
        name: "description",
        content:
          "Smart Matching connects your agricultural waste with the best buyers and live purchase demands by type, location and quality.",
      },
      { property: "og:title", content: "Smart Matching | Takathamani" },
      { property: "og:description", content: "Smart Matching connects your waste with the best buyers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SmartMatchingPage,
});

const CRITERIA: { Icon: LucideIcon; label: string }[] = [
  { Icon: Tag,         label: "Waste Type" },
  { Icon: MapPin,      label: "Location" },
  { Icon: ShieldCheck, label: "Quality" },
];

const DISTANCES: Record<string, number> = {
  "GreenFuel Ltd": 90,
  "Tanga Feeds": 72,
  "Kenya Biomass Energy": 120,
};

function SmartMatchingPage() {
  const getBuyersFn = useServerFn(getBuyers);
  const getDash = useServerFn(getDashboard);
  const getAllListingsFn = useServerFn(getAllListings);

  const buyersQ = useQuery({ queryKey: ["buyers"], queryFn: () => getBuyersFn() });
  const dashQ = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const allListingsQ = useQuery({ queryKey: ["all-listings"], queryFn: () => getAllListingsFn() });
  const buyerDemands = useBuyerDemands();

  if (buyersQ.isLoading || dashQ.isLoading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Matching agricultural materials...</p>;
  }

  const isBuyer = dashQ.data?.role === "buyer";
  const allFarmerListings = allListingsQ.data ?? dashQ.data?.allListings ?? [];
  const farmerOwnListings = dashQ.data?.listings ?? [];

  // Demands created by this buyer (both local and database listings)
  const dbDemandsAsBuyer: BuyerDemand[] = isBuyer
    ? farmerOwnListings.map((l) => ({
        id: `demand-db-${l.id}`,
        buyer_id: "current-buyer",
        buyer_name: dashQ.data?.profile.full_name || "Buyer",
        company_name: dashQ.data?.profile.full_name || "Buyer Enterprise",
        phone: dashQ.data?.profile.phone || "",
        waste_type: l.waste_type,
        quantity_tons: l.quantity_tons,
        price_per_ton: l.price_per_ton,
        county: l.county,
        location: l.location,
        created_at: l.created_at,
        status: "active" as const,
        image_url: l.image_url,
      }))
    : [];

  const storedDemands = buyerDemands.filter(
    (d) =>
      d.buyer_id === "current-buyer" ||
      d.phone === dashQ.data?.profile.phone ||
      d.buyer_name.toLowerCase() === dashQ.data?.profile.full_name.toLowerCase()
  );

  const myDemands = [...storedDemands, ...dbDemandsAsBuyer];
  // If buyer has their own demands, match them; otherwise allow previewing with all active buyer demands
  const buyerActiveDemands = myDemands.length > 0 ? myDemands : buyerDemands;

  // Filter out buyer's own items from farmer listings
  const availableFarmerListings = allFarmerListings.filter(
    (fl) => fl.farmer_id !== dashQ.data?.profile.id
  );

  // 1. FOR BUYERS: Match buyer demands against ALL available farmer listings in the marketplace
  const matchingFarmerListings = availableFarmerListings
    .map((fl) => {
      const matchedDemand = buyerActiveDemands.find((d) => wasteTypesMatch(d.waste_type, fl.waste_type));
      return matchedDemand ? { listing: fl, matchedDemand } : null;
    })
    .filter(Boolean) as { listing: Listing; matchedDemand: BuyerDemand }[];

  const unmatchedFarmerListings = availableFarmerListings.filter(
    (fl) => !matchingFarmerListings.some((m) => m.listing.id === fl.id)
  );

  // 2. FOR FARMERS: Match farmer's own listings against buyer purchase demands
  const matchingBuyerDemands = buyerDemands
    .map((d) => {
      const matchedListing = farmerOwnListings.find((l) => wasteTypesMatch(l.waste_type, d.waste_type));
      return matchedListing ? { demand: d, matchedWasteType: matchedListing.waste_type } : null;
    })
    .filter(Boolean) as { demand: BuyerDemand; matchedWasteType: string }[];

  const scored: Buyer[] = [...(buyersQ.data ?? [])].sort(
    (a, b) => Number(b.rating) - Number(a.rating)
  );
  const bestBuyer = scored[0];
  const otherBuyers = scored.slice(1);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Smart Matching
          </h1>
          <p className="text-sm text-muted-foreground">
            {isBuyer
              ? "Matching your purchase demands with verified smallholders and available agricultural waste."
              : "Matching your agricultural waste with verified industrial buyers and live demands."}
          </p>
        </div>

        {isBuyer && (
          <AddBuyerDemandDialog
            availableFarmerListings={availableFarmerListings}
            buyerName={dashQ.data?.profile.full_name}
            phone={dashQ.data?.profile.phone}
            county={dashQ.data?.profile.county}
          >
            <button className="flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-forest-deep transition-colors">
              <ShoppingBag className="h-3.5 w-3.5" />
              + Add New Demand
            </button>
          </AddBuyerDemandDialog>
        )}
      </div>

      {/* Criteria */}
      <div className="flex justify-between gap-2 rounded-2xl border border-border bg-card p-4 shadow-xs">
        {CRITERIA.map((c) => (
          <div key={c.label} className="flex flex-col items-center gap-1.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <c.Icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground">{c.label}</span>
          </div>
        ))}
      </div>

      {/* BUYER VIEW: Matching Farmer Waste Listings */}
      {isBuyer ? (
        <div className="space-y-6">
          {matchingFarmerListings.length > 0 ? (
            <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-lg font-bold text-foreground">
                    {matchingFarmerListings.length} Farmer Listing{matchingFarmerListings.length !== 1 ? "s" : ""} Matching Your Demands
                  </h2>
                </div>
                <span className="rounded-full bg-forest px-3 py-0.5 text-xs font-bold text-white">
                  Available to Source
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                These farmers have agricultural waste ready for pickup that matches your purchase demands:
              </p>

              <div className="space-y-3">
                {matchingFarmerListings.map(({ listing: fl, matchedDemand: md }) => (
                  <div
                    key={fl.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs transition-all hover:border-forest/40"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={listingImage(fl)}
                        alt={fl.waste_type}
                        className="h-16 w-16 rounded-xl object-cover shrink-0"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-extrabold text-foreground text-base">{fl.waste_type}</p>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {fl.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Available: <span className="font-bold text-foreground">{fl.quantity_tons} Tons</span> · {fl.location}, {fl.county} County
                        </p>
                        <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Sparkles className="h-2.5 w-2.5" />
                          Matches your {md.waste_type} request
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                      <div className="text-right">
                        <p className="text-base font-extrabold text-primary">
                          KSh {fl.price_per_ton.toLocaleString("en-KE")}
                          <span className="text-[10px] font-normal text-muted-foreground">/ton</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">Farmer List Price</p>
                      </div>

                      <AddBuyerDemandDialog
                        availableFarmerListings={availableFarmerListings}
                        defaultListing={fl}
                        buyerName={dashQ.data?.profile.full_name}
                        phone={dashQ.data?.profile.phone}
                        county={dashQ.data?.profile.county}
                      >
                        <button className="rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep flex items-center gap-1.5 transition-colors shadow-xs">
                          <ShoppingBag className="h-3.5 w-3.5" />
                          I Want This Waste
                        </button>
                      </AddBuyerDemandDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="font-bold text-foreground">No Direct Matches For Your Demands Yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {buyerActiveDemands.length > 0
                  ? `We are scanning for farmers listing ${buyerActiveDemands.map((d) => d.waste_type).join(", ")}. Check the available farmer listings below to source directly.`
                  : "Post your agricultural waste requirements above to start matching with verified smallholders."}
              </p>
            </div>
          )}

          {/* More available farmer listings in the marketplace */}
          {unmatchedFarmerListings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-forest" />
                  {matchingFarmerListings.length > 0
                    ? "Other Verified Smallholder Waste Available in Marketplace"
                    : "Available Agricultural Waste from Verified Farmers"}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {unmatchedFarmerListings.length} Available
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {unmatchedFarmerListings.map((fl) => (
                  <div
                    key={fl.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-xs transition-all hover:border-forest/40"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={listingImage(fl)}
                        alt={fl.waste_type}
                        className="h-16 w-16 rounded-xl object-cover shrink-0"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-foreground text-sm truncate">{fl.waste_type}</p>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold text-primary">
                            {fl.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fl.quantity_tons} Tons · {fl.county} County
                        </p>
                        <p className="text-xs font-extrabold text-primary mt-1">
                          KSh {fl.price_per_ton.toLocaleString("en-KE")}/ton
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end border-t border-border/60 pt-2.5">
                      <AddBuyerDemandDialog
                        availableFarmerListings={availableFarmerListings}
                        defaultListing={fl}
                        buyerName={dashQ.data?.profile.full_name}
                        phone={dashQ.data?.profile.phone}
                        county={dashQ.data?.profile.county}
                      >
                        <button className="rounded-lg bg-forest/15 px-3 py-1.5 text-xs font-bold text-forest hover:bg-forest hover:text-white transition-colors flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          Source This Waste
                        </button>
                      </AddBuyerDemandDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* FARMER VIEW: Matching Buyer Demands */
        matchingBuyerDemands.length > 0 ? (
          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg font-bold text-foreground">
                  {matchingBuyerDemands.length} Buyer{matchingBuyerDemands.length !== 1 ? "s" : ""} Matching Your Listings
                </h2>
              </div>
              <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                Top Match
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              These buyers are actively looking to purchase waste types that match your listings:
            </p>

            <div className="space-y-3">
              {matchingBuyerDemands.map(({ demand: md, matchedWasteType }) => {
                const img = md.image_url || resolveWasteImage(md.waste_type).url;
                return (
                  <div
                    key={md.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={img}
                        alt={md.waste_type}
                        className="h-14 w-14 rounded-xl object-cover"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-foreground text-base">{md.company_name}</p>
                          <BadgeCheck className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Wants: <span className="font-semibold text-foreground">{md.waste_type}</span> · {md.location || md.county}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Sparkles className="h-2.5 w-2.5" />
                          Matches your {matchedWasteType} listing
                        </span>
                        {md.notes && (
                          <p className="text-[11px] text-muted-foreground/90 italic line-clamp-1 mt-0.5">
                            "{md.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="text-base font-extrabold text-primary">
                          KSh {md.price_per_ton.toLocaleString("en-KE")}
                          <span className="text-[10px] font-normal text-muted-foreground">/ton</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">Offered Price</p>
                      </div>

                      <button
                        onClick={() =>
                          toast.success(`Connecting with ${md.company_name}`, {
                            description: `Contact ${md.phone} to supply your ${matchedWasteType}.`,
                          })
                        }
                        className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        Supply This Buyer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-xs">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold text-foreground">No matching buyer demands yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Buyers posting demands for {farmerOwnListings.map((l) => l.waste_type).join(", ")} will appear here automatically.
            </p>
          </div>
        )
      )}

      {/* Recommended Verified Directory Match */}
      {bestBuyer && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-foreground">
              {isBuyer ? "Top Rated Circular Partner" : `Top Rated Buyer for Your Waste`}
            </p>
            <button aria-label="Dismiss match" className="text-muted-foreground hover:text-foreground">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-xl font-bold text-primary">
              {bestBuyer.company_name.slice(0, 1)}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-lg font-bold text-foreground">{bestBuyer.company_name}</p>
                {bestBuyer.verified && <BadgeCheck className="h-4.5 w-4.5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">
                {bestBuyer.producer_type} · {DISTANCES[bestBuyer.company_name] ?? 50} km
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-foreground">
                <Star className="h-4 w-4 fill-gold text-gold" />
                <span className="font-semibold">{Number(bestBuyer.rating).toFixed(1)}</span>
                <span className="text-muted-foreground">({bestBuyer.reviews} reviews)</span>
              </p>
            </div>
            <p className="text-xl font-extrabold text-primary">
              KSh {bestBuyer.price_max.toLocaleString("en-KE")}
              <span className="text-xs font-semibold text-muted-foreground">/ton</span>
            </p>
          </div>
          <button
            onClick={() =>
              toast.success(`Connected with ${bestBuyer.company_name}`, {
                description: "Their procurement team has been notified.",
              })
            }
            className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Connect with Partner
          </button>
        </div>
      )}

      {/* Directory Partners */}
      <div>
        <p className="mb-3 text-sm font-bold text-muted-foreground">Other Verified Circular Partners</p>
        <div className="space-y-3">
          {otherBuyers.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-lg font-bold text-primary">
                {b.company_name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">{b.company_name}</p>
                <p className="text-sm text-muted-foreground">
                  KSh {b.price_max.toLocaleString("en-KE")}/ton · {DISTANCES[b.company_name] ?? 50} km
                </p>
              </div>
              <button
                onClick={() =>
                  toast.info(`${b.company_name} details`, {
                    description: `They trade in ${b.buys.join(", ")}.`,
                  })
                }
                className="rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
