import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  MessageSquare,
  ShoppingBag,
  MapPin,
  Package,
  CheckCircle2,
  BadgeCheck,
  Building2,
  Sparkles,
  Layers,
  Phone,
  User,
} from "lucide-react";
import { getDashboard, getAllListings } from "@/lib/marketplace.functions";
import type { Listing, BuyerDemand } from "@/lib/types";
import { listingImage, resolveWasteImage } from "@/lib/waste-images";
import { timeAgo } from "@/lib/types";
import { useBuyerDemands } from "@/lib/buyer-demands";
import { AddBuyerDemandDialog } from "@/components/add-buyer-demand-dialog";
import { AddListingDialog } from "@/components/add-listing-dialog";
import { SendMessageDialog } from "@/components/send-message-dialog";
import { SendBuyerOfferDialog } from "@/components/send-buyer-offer-dialog";
import { resolveFarmerForListing, useActiveFarmerAccount } from "@/lib/farmer-accounts";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Agricultural Waste Exchange | Takathamani" },
      {
        name: "description",
        content: "Discover verified agricultural waste available directly from farmers across Kenya on Takathamani.",
      },
      { property: "og:title", content: "Marketplace — Agricultural Waste Exchange | Takathamani" },
      { property: "og:description", content: "Discover verified agricultural waste available directly from farmers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketplacePage,
});

const FILTERS = ["All", "Maize Cobs", "Rice Husk", "Sugarcane Bagasse", "Coffee Husks", "Other"];

function MarketplacePage() {
  const getDashFn = useServerFn(getDashboard);
  const getAllListingsFn = useServerFn(getAllListings);

  const { data: dashData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashFn(),
  });
  const { data: allListingsData } = useQuery({
    queryKey: ["all-listings"],
    queryFn: () => getAllListingsFn(),
  });
  const allBuyerDemands = useBuyerDemands();

  const allFarmerListings = allListingsData ?? dashData?.allListings ?? [];
  const isBuyer = dashData?.role === "buyer";
  const activeFarmer = useActiveFarmerAccount();

  // Farmers default to viewing Buyer Purchase Demands; Buyers default to viewing Farmer Waste
  const [activeTab, setActiveTab] = useState<"buyer_demands" | "farmer_waste">(
    isBuyer ? "farmer_waste" : "buyer_demands"
  );
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Filter Farmer Listings
  const filteredFarmerListings = allFarmerListings.filter((l) => {
    const matchesCategory =
      filter === "All" ||
      (filter === "Other"
        ? !["Maize Cobs", "Rice Husk", "Sugarcane Bagasse", "Coffee Husks"].includes(l.waste_type)
        : l.waste_type.toLowerCase().includes(filter.toLowerCase()));
    const matchesSearch =
      (l.waste_type + l.location + l.county)
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter Buyer Demands (Buyer Listings)
  const filteredBuyerDemands = allBuyerDemands.filter((d) => {
    const matchesCategory =
      filter === "All" ||
      (filter === "Other"
        ? !["Maize Cobs", "Rice Husk", "Sugarcane Bagasse", "Coffee Husks"].includes(d.waste_type)
        : d.waste_type.toLowerCase().includes(filter.toLowerCase()));
    const matchesSearch =
      (d.waste_type + (d.location || "") + d.county + (d.company_name || "") + d.buyer_name)
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Marketplace & Exchange
          </h1>
          <p className="text-sm text-muted-foreground">
            {isBuyer
              ? "Discover verified crop residues from Kenyan farmers or view industrial demands."
              : "Discover live purchase demands from industrial buyers across Kenya ready to source your waste."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isBuyer ? (
            <AddBuyerDemandDialog
              availableFarmerListings={allFarmerListings}
              buyerName={dashData?.profile.full_name}
              phone={dashData?.profile.phone}
              county={dashData?.profile.county}
            >
              <button className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-forest-deep transition-all">
                <ShoppingBag className="h-4 w-4" />
                <span>+ List Waste Demand</span>
              </button>
            </AddBuyerDemandDialog>
          ) : (
            <AddListingDialog>
              <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                <Package className="h-4 w-4" />
                <span>+ Add Waste Listing</span>
              </button>
            </AddListingDialog>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex rounded-2xl border border-border bg-card p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("buyer_demands")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold transition-all ${
            activeTab === "buyer_demands"
              ? "bg-forest text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Buyer Purchase Listings ({allBuyerDemands.length})</span>
          {!isBuyer && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-extrabold">
              Recommended for Farmers
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("farmer_waste")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold transition-all ${
            activeTab === "farmer_waste"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Farmer Waste Available ({allFarmerListings.length})</span>
          {isBuyer && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-extrabold">
              Recommended for Buyers
            </span>
          )}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "buyer_demands"
                ? "Search buyer demands by waste type, county, or company..."
                : "Search farmer listings by crop residue, location or county..."
            }
            aria-label="Search"
            className="w-full rounded-full border border-input bg-card py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                filter === f
                  ? activeTab === "buyer_demands"
                    ? "bg-forest text-white font-bold"
                    : "bg-primary text-primary-foreground font-bold"
                  : "border border-border bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: BUYER PURCHASE LISTINGS (DEMANDS) - Especially shown for Farmers */}
      {activeTab === "buyer_demands" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Verified purchase demands from industrial buyers looking to buy crop residues.</span>
            <span className="font-bold text-foreground">{filteredBuyerDemands.length} Demands Active</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filteredBuyerDemands.map((d) => {
              const img = d.image_url || resolveWasteImage(d.waste_type).url;

              return (
                <div
                  key={d.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-xs transition-all hover:border-forest/40 hover:shadow-md"
                >
                  <div>
                    <div className="relative h-44 w-full overflow-hidden rounded-xl bg-muted">
                      <img
                        src={img}
                        alt={d.waste_type}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-forest/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        Buying Now
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/75 backdrop-blur-xs px-2.5 py-1 text-xs font-black text-white">
                        {d.quantity_tons} Tons Needed
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-foreground text-base">
                          {d.company_name || d.buyer_name}
                        </span>
                        <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-1">
                        <h3 className="font-bold text-foreground text-sm truncate">
                          Wants: {d.waste_type}
                        </h3>
                        <span className="text-xs font-black text-forest">
                          KSh {d.price_per_ton.toLocaleString("en-KE")}/ton
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {d.location || d.county} County
                      </p>

                      {d.notes && (
                        <p className="mt-2 text-xs text-muted-foreground/90 italic bg-secondary/40 p-2 rounded-lg line-clamp-2">
                          "{d.notes}"
                        </p>
                      )}

                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Requested {timeAgo(d.created_at)} · Total budget: KSh {(d.quantity_tons * d.price_per_ton).toLocaleString("en-KE")}
                      </p>
                    </div>
                  </div>

                  {/* Actions for Farmer to supply or message buyer */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <SendBuyerOfferDialog
                      demand={d}
                      farmerName={dashData?.profile.full_name}
                      farmerPhone={dashData?.profile.phone}
                    >
                      <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 px-3 text-xs font-bold text-white hover:bg-forest-deep transition-colors shadow-xs">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>I Can Supply This Waste</span>
                      </button>
                    </SendBuyerOfferDialog>

                    <SendBuyerOfferDialog
                      demand={d}
                      farmerName={dashData?.profile.full_name}
                      farmerPhone={dashData?.profile.phone}
                    >
                      <button
                        className="flex items-center justify-center gap-1 rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
                        title="Send Message to Buyer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </SendBuyerOfferDialog>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBuyerDemands.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">No buyer purchase listings found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for another waste type or clear your category filter.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FARMER WASTE AVAILABLE - Especially shown for Buyers */}
      {activeTab === "farmer_waste" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Verified crop residues & biomass listed by farmers across Kenya.</span>
            <span className="font-bold text-foreground">{filteredFarmerListings.length} Available</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filteredFarmerListings.map((l) => {
              const farmerInfo = resolveFarmerForListing(l, activeFarmer);

              return (
              <div
                key={l.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden rounded-xl bg-muted">
                    <img
                      src={listingImage(l)}
                      alt={l.waste_type}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-white">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      {l.status}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/75 backdrop-blur-xs px-2.5 py-1 text-xs font-black text-white">
                      {l.quantity_tons} Tons Available
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-extrabold text-foreground text-base truncate">{l.waste_type}</h3>
                      <span className="text-xs font-black text-primary">
                        KSh {l.price_per_ton.toLocaleString("en-KE")}/ton
                      </span>
                    </div>

                    {/* Farmer Details: Real Account Name, Contacts and Location */}
                    <div className="mt-2.5 rounded-xl border border-border/70 bg-secondary/40 p-2.5 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <User className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{farmerInfo.name}</span>
                        </div>
                        <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/25 shrink-0">
                          Verified Farmer
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-1.5 pt-0.5 border-t border-border/50">
                        <a
                          href={`tel:${farmerInfo.phone}`}
                          className="flex items-center gap-1 font-bold text-primary hover:underline"
                          title="Call farmer"
                        >
                          <Phone className="h-3 w-3" />
                          {farmerInfo.phone}
                        </a>

                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          {l.location}, {l.county} County
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Listed {timeAgo(l.created_at)} · Total value: KSh {(l.quantity_tons * l.price_per_ton).toLocaleString("en-KE")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <AddBuyerDemandDialog
                    availableFarmerListings={allFarmerListings}
                    defaultListing={l}
                    buyerName={dashData?.profile.full_name}
                    phone={dashData?.profile.phone}
                    county={dashData?.profile.county}
                  >
                    <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 px-3 text-xs font-bold text-white hover:bg-forest-deep transition-colors shadow-xs">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>{isBuyer ? "I Want This Waste" : "Place Matching Demand"}</span>
                    </button>
                  </AddBuyerDemandDialog>

                  {/* Message Farmer Modal Dialog */}
                  <SendMessageDialog
                    listing={{ ...l, farmer_name: farmerInfo.name, farmer_phone: farmerInfo.phone }}
                    senderName={dashData?.profile.full_name}
                    senderPhone={dashData?.profile.phone}
                  >
                    <button
                      className="flex items-center justify-center gap-1 rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
                      title="Send Message to Farmer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                  </SendMessageDialog>
                </div>
              </div>
              );
            })}
          </div>

          {filteredFarmerListings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">No farmer waste listings found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for another waste type or clear your category filter.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
