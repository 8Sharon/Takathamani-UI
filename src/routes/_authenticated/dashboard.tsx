import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Package,
  Wallet,
  Recycle,
  Sprout,
  ChevronRight,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Search,
  MapPin,
  Mail,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Sparkles,
  PhoneCall,
  BadgeCheck,
  Building2,
  ArrowUpRight,
  MessageSquare,
  Scale,
  Activity,
  Clock,
} from "lucide-react";
import { getDashboard } from "@/lib/marketplace.functions";
import { listingImage, resolveWasteImage } from "@/lib/waste-images";
import { timeAgo, type Listing, type BuyerDemand, wasteTypesMatch } from "@/lib/types";
import { AddListingDialog } from "@/components/add-listing-dialog";
import { AddBuyerDemandDialog } from "@/components/add-buyer-demand-dialog";
import { useBuyerDemands } from "@/lib/buyer-demands";
import { useRoleMessages } from "@/lib/messages-store";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useWeather, describeWeather } from "@/hooks/use-weather";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Takathamani" },
      {
        name: "description",
        content: "Your Takathamani dashboard: listings, earnings, buyer demands and smart matches.",
      },
      { property: "og:title", content: "Dashboard — Takathamani" },
      { property: "og:description", content: "Listings, earnings, buyer demands and smart matches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 0 && h < 5)  return "Good Night";   // midnight – 4:59 AM
  if (h < 12)           return "Good Morning";  // 5 AM – 11:59 AM
  if (h < 17)           return "Good Afternoon"; // noon – 4:59 PM
  if (h < 21)           return "Good Evening";   // 5 PM – 8:59 PM
  return "Good Night";                           // 9 PM – 11:59 PM
}

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0 || code === 1) return <Sun className={className} />;
  if (code <= 3) return <CloudSun className={className} />;
  if (code <= 67) return <CloudRain className={className} />;
  if (code <= 77) return <CloudSnow className={className} />;
  if (code <= 82) return <CloudRain className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

function DashboardPage() {
  const getDash = useServerFn(getDashboard);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDash(),
  });
  const buyerDemands = useBuyerDemands();
  const geo = useGeolocation();
  const weather = useWeather(geo.coords);
  const isBuyer = data?.role === "buyer";

  // Hooks must run before any early return — otherwise the hook order changes
  // between the loading and loaded renders and React crashes the route.
  const { messages: roleMsgs, unreadCount } = useRoleMessages(isBuyer ? "buyer" : "farmer");

  if (isError) {
    console.error("Dashboard failed to load:", error);
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-semibold text-foreground">We couldn't load your dashboard.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Something went wrong while fetching your account data. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Loading your dashboard...</p>;
  }

  const firstName = data.profile.full_name.split(" ")[0] || "User";
  const earnings = data.transactions.reduce((s, t) => s + t.amount, 0);
  const tons = data.transactions.reduce((s, t) => s + t.tons, 0);
  const co2 = tons * 2.33;
  const matches = data.listings.length > 0 ? buyerDemands.length : 2;
  // Farmer real stats
  const totalTonsListed = data.listings.reduce((s, l) => s + (l.quantity_tons ?? 0), 0);
  const activeTonsListed = data.listings
    .filter((l) => l.status === "available")
    .reduce((s, l) => s + (l.quantity_tons ?? 0), 0);
  const totalInventoryValue = data.listings
    .filter((l) => l.status === "available")
    .reduce((s, l) => s + ((l.quantity_tons ?? 0) * (l.price_per_ton ?? 0)), 0);

  // For buyers: find demands created by this buyer (both local and database listings)
  const dbDemandsAsBuyer: BuyerDemand[] = isBuyer
    ? data.listings.map((l) => ({
        id: `demand-db-${l.id}`,
        buyer_id: "current-buyer",
        buyer_name: data.profile.full_name || "Buyer",
        company_name: data.profile.full_name || "Buyer Enterprise",
        phone: data.profile.phone || "",
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
      d.phone === data.profile.phone ||
      d.buyer_name.toLowerCase() === data.profile.full_name.toLowerCase()
  );

  const myDemands = [...storedDemands, ...dbDemandsAsBuyer];


  const myTonsDemanded = myDemands.reduce((s, d) => s + (d.quantity_tons ?? 0), 0);
  const myTotalBudget = myDemands.reduce((s, d) => s + ((d.quantity_tons ?? 0) * (d.price_per_ton ?? 0)), 0);
  const matchedFarmerListings = (data.allListings ?? []).filter((l) =>
    myDemands.some((d) => wasteTypesMatch(d.waste_type, l.waste_type))
  );
  const matchedTonsAvailable = matchedFarmerListings.reduce((s, l) => s + (l.quantity_tons ?? 0), 0);

  // Account-specific recent activities (including messaging, demands/listings and deals)
  const recentActivities = isBuyer
    ? [
        ...myDemands.map((d) => ({
          id: `demand-${d.id}`,
          type: "demand" as const,
          title: `Requested ${d.quantity_tons}T of ${d.waste_type}`,
          subtitle: `${d.location || d.county} · Budget KSh ${d.price_per_ton.toLocaleString("en-KE")}/t`,
          timestamp: new Date(d.created_at).getTime(),
          timeFormatted: timeAgo(d.created_at),
          icon: ShoppingBag,
          iconBg: "bg-forest/15 text-forest border border-forest/20",
          tag: "Demand",
          tagColor: "bg-forest/15 text-forest",
          link: "/listings",
        })),
        ...data.transactions.map((t) => ({
          id: `trans-${t.id}`,
          type: "deal" as const,
          title: `Procured ${t.tons}T ${t.waste_type || "waste"}`,
          subtitle: `KSh ${t.amount.toLocaleString("en-KE")} paid`,
          timestamp: new Date(t.created_at).getTime(),
          timeFormatted: timeAgo(t.created_at),
          icon: CheckCircle2,
          iconBg: "bg-primary/10 text-primary border border-primary/20",
          tag: "Procured",
          tagColor: "bg-primary/10 text-primary",
          link: "/listings",
        })),
        ...roleMsgs.map((m) => ({
          id: `msg-${m.id}`,
          type: "message" as const,
          title: m.subject,
          subtitle: `${m.sender} · ${m.listing_title ? `Re: ${m.listing_title}` : m.body.slice(0, 42) + "..."}`,
          timestamp: new Date(m.created_at).getTime(),
          timeFormatted: timeAgo(m.created_at),
          icon: MessageSquare,
          iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
          tag: "Message",
          tagColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          link: "/messages",
        })),
      ]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3)
    : [
        ...data.listings.map((l) => ({
          id: `listing-${l.id}`,
          type: "listing" as const,
          title: `Listed ${l.quantity_tons}T of ${l.waste_type}`,
          subtitle: `${l.location || l.county || "Farm"} · KSh ${l.price_per_ton.toLocaleString("en-KE")}/t`,
          timestamp: new Date(l.created_at).getTime(),
          timeFormatted: timeAgo(l.created_at),
          icon: Package,
          iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          tag: "Listing",
          tagColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          link: "/listings",
        })),
        ...data.transactions.map((t) => ({
          id: `trans-${t.id}`,
          type: "deal" as const,
          title: `Deal Closed: ${t.tons}T ${t.waste_type || "waste"}`,
          subtitle: `KSh ${t.amount.toLocaleString("en-KE")} earned`,
          timestamp: new Date(t.created_at).getTime(),
          timeFormatted: timeAgo(t.created_at),
          icon: CheckCircle2,
          iconBg: "bg-primary/10 text-primary border border-primary/20",
          tag: "Completed",
          tagColor: "bg-primary/10 text-primary",
          link: "/dashboard",
        })),
        ...roleMsgs.map((m) => ({
          id: `msg-${m.id}`,
          type: "message" as const,
          title: m.subject,
          subtitle: `${m.sender} · ${m.listing_title ? `Re: ${m.listing_title}` : m.body.slice(0, 42) + "..."}`,
          timestamp: new Date(m.created_at).getTime(),
          timeFormatted: timeAgo(m.created_at),
          icon: MessageSquare,
          iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
          tag: "Message",
          tagColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          link: "/messages",
        })),
      ]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary/35 p-5 sm:p-6 shadow-xs">
        {/* Decorative background glows */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-forest/10 blur-xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar or Initials Badge */}
            <div className="relative flex-shrink-0">
              {data.profile.avatar_url ? (
                <img
                  src={data.profile.avatar_url}
                  alt={data.profile.full_name}
                  className="h-14 w-14 rounded-2xl object-cover ring-2 ring-primary/20 shadow-xs"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-forest font-black text-lg text-primary-foreground shadow-sm">
                  {firstName.charAt(0)}
                  {data.profile.full_name.split(" ")[1]?.charAt(0) || ""}
                </div>
              )}
              {data.profile.verified && (
                <span
                  title="Verified Account"
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-card shadow-xs"
                >
                  <CheckCircle2 className="h-3 w-3 stroke-[3]" />
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {greeting()}, {firstName} <span aria-hidden>👋</span>
                </h1>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isBuyer
                      ? "bg-forest/15 text-forest border border-forest/30"
                      : "bg-primary/15 text-primary border border-primary/30"
                  }`}
                >
                  {isBuyer ? "🏢 Buyer Account" : "🌾 Farmer Account"}
                </span>

                {data.profile.county && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border/60">
                    <MapPin className="h-3 w-3 text-primary" />
                    {data.profile.county}
                  </span>
                )}
              </div>

              {/* Subtitle / Live status indicator */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  {isBuyer
                    ? `${buyerDemands.length} active market demands live`
                    : `${data.listings.filter((l) => l.status === "available").length} Listings active · Visible to ${buyerDemands.length || 15}+ industrial buyers`}
                </span>
                <span className="hidden sm:inline text-border">•</span>
                <span className="text-muted-foreground">
                  {isBuyer
                    ? "Connect directly with local smallholders"
                    : "Turning your agricultural waste into income"}
                </span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {isBuyer ? (
              <AddBuyerDemandDialog
                availableFarmerListings={data.allListings ?? []}
                buyerName={data.profile.full_name}
                phone={data.profile.phone}
                county={data.profile.county}
              >
                <button className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-forest-deep transition-all">
                  <ShoppingBag className="h-4 w-4" />
                  <span>+ List Waste I Want</span>
                </button>
              </AddBuyerDemandDialog>
            ) : (
              <AddListingDialog>
                <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                  <Package className="h-4 w-4" />
                  <span>+ Add New Listing</span>
                </button>
              </AddListingDialog>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={`grid gap-4 ${isBuyer ? "grid-cols-2 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
        {isBuyer ? (
          <>
            <StatCard
              Icon={ShoppingBag}
              label="My Purchase Demands"
              value={`${myDemands.length} Demands`}
              sub={`${myTonsDemanded.toLocaleString("en-KE")} tons requested`}
              accent="primary"
              badge="Market Live"
            />
            <StatCard
              Icon={Scale}
              label="Total Volume Required"
              value={`${myTonsDemanded.toLocaleString("en-KE")} Tons`}
              sub={`${matchedTonsAvailable.toLocaleString("en-KE")} Tons available in market`}
              accent="amber"
              badge="Procurement"
              progress={myTonsDemanded > 0 ? (matchedTonsAvailable / myTonsDemanded) * 100 : 0}
            />
            <StatCard
              Icon={Wallet}
              label="Total Procurement Budget"
              value={`KSh ${myTotalBudget.toLocaleString("en-KE")}`}
              sub="Based on your demand budgets"
              accent="forest"
              badge="Est. Budget"
            />
            <StatCard
              Icon={MessageSquare}
              label="Farmer Supply Matches"
              value={`${matchedFarmerListings.length} Matches`}
              sub={`${unreadCount} unread messages`}
              accent="blue"
              badge={unreadCount > 0 ? "Action Needed" : "Live Matches"}
            />
          </>
        ) : (
          <>
            <StatCard
              Icon={Package}
              label="My Waste Listings"
              value={`${data.listings.length} Listings`}
              sub={`${activeTonsListed.toLocaleString("en-KE")} tons active`}
              accent="primary"
              badge="Market Live"
            />
            <StatCard
              Icon={Scale}
              label="Total Waste Volume"
              value={`${totalTonsListed.toLocaleString("en-KE")} Tons`}
              sub={`${activeTonsListed.toLocaleString("en-KE")} Tons available`}
              accent="amber"
              badge="Inventory"
              progress={totalTonsListed > 0 ? (activeTonsListed / totalTonsListed) * 100 : 0}
            />
            <StatCard
              Icon={Wallet}
              label="Potential Waste Value"
              value={`KSh ${totalInventoryValue.toLocaleString("en-KE")}`}
              sub="Based on your listing prices"
              accent="forest"
              badge="Est. Value"
            />
          </>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Smart Matching Banner */}
          <Link
            to="/smart-matching"
            className="group relative block overflow-hidden rounded-3xl bg-forest p-6 text-primary-foreground shadow-md transition-all hover:shadow-lg"
          >
            {/* Decorative circles */}
            <span className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
            <span className="pointer-events-none absolute -bottom-10 right-16 h-32 w-32 rounded-full bg-white/5" />
            <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative z-10 max-w-[72%]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur mb-2">
                <Sparkles className="h-3 w-3 text-lime" /> Smart Matching
              </span>
              <h2 className="text-xl font-extrabold text-white">
                {isBuyer
                  ? matchedFarmerListings.length > 0
                    ? `Matched with ${matchedFarmerListings.length} Farmer Listing${matchedFarmerListings.length === 1 ? "" : "s"}!`
                    : `${(data.allListings ?? []).length} Farmer Listings Available for Smart Matching!`
                  : `We've matched ${buyerDemands.length} buyers seeking agricultural waste!`}
              </h2>
              <p className="mt-1 text-xs text-primary-foreground/80 sm:text-sm">
                {isBuyer
                  ? matchedFarmerListings.length > 0
                    ? `${matchedTonsAvailable.toLocaleString("en-KE")} tons of verified farmer waste matching your purchase demands.`
                    : `${(data.allListings ?? []).length} verified crop residue listings ready in the marketplace.`
                  : "Right material, right buyer, right price. Close deals with 1 click."}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors group-hover:bg-primary/90">
                View Matches <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>

          {/* Main Listings Section: If buyer, show ONLY their purchase demands. If farmer, show ONLY their waste listings */}
          {isBuyer ? (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    My Purchase Listings (Waste Demands)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Manage the agricultural waste demands and specifications you have requested.
                  </p>
                </div>
                <Link to="/listings" className="text-xs font-bold text-primary hover:underline">
                  Manage All ({myDemands.length})
                </Link>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {myDemands.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col justify-between rounded-2xl border border-border/80 bg-secondary/30 p-3.5 transition-all hover:border-forest/40"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={d.image_url || resolveWasteImage(d.waste_type).url}
                        alt={d.waste_type}
                        className="h-16 w-16 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-foreground text-sm truncate">{d.waste_type}</p>
                          <span className="text-[10px] font-bold text-forest bg-forest/15 px-2 py-0.5 rounded-full shrink-0">
                            Active
                          </span>
                        </div>
                        <p className="text-xs font-black text-primary mt-1">
                          {d.quantity_tons} Tons · KSh {d.price_per_ton.toLocaleString("en-KE")}/t
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {d.location || d.county} County · {timeAgo(d.created_at)}
                        </p>
                      </div>
                    </div>
                    {d.notes && (
                      <p className="mt-2 text-xs italic text-muted-foreground bg-muted/60 rounded-lg p-2">
                        "{d.notes}"
                      </p>
                    )}
                  </div>
                ))}
                {myDemands.length === 0 && (
                  <div className="col-span-2 py-10 text-center rounded-2xl border border-dashed border-border bg-card">
                    <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="font-semibold text-foreground">No purchase listings yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click "+ List Waste I Want" above to post your purchase demand.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">My Listings</h2>
                  <p className="text-xs text-muted-foreground">
                    Manage what you have made available on the marketplace.
                  </p>
                </div>
                <Link to="/listings" className="text-xs font-bold text-primary hover:underline">
                  View All
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {data.listings.map((l) => (
                  <div key={l.id} className="rounded-2xl border border-border bg-card p-3 shadow-xs flex flex-col justify-between">
                    <div>
                      <img
                        src={listingImage(l)}
                        alt={l.waste_type}
                        loading="lazy"
                        className="h-28 w-full rounded-xl object-cover"
                        width={816}
                        height={816}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <p className="mt-2.5 text-sm font-bold text-foreground">{l.waste_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.quantity_tons} Tons · KSh {l.price_per_ton.toLocaleString("en-KE")}/ton
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {l.location} · {timeAgo(l.created_at)}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <CheckCircle2 className="h-3 w-3" />
                        {l.status}
                      </span>
                    </div>
                  </div>
                ))}
                {data.listings.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-3 py-6 text-center">
                    No listings yet — add your first one from Quick Actions.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar widgets */}
        <div className="space-y-5">
          {/* Live weather widget */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <p className="font-bold text-foreground">
                {weather.loading ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Locating...
                  </span>
                ) : geo.denied ? (
                  data.profile.county || "Kenya"
                ) : (
                  weather.placeName
                )}
              </p>
              {weather.loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <WeatherIcon code={weather.weatherCode} className="h-6 w-6 text-gold" />
              )}
            </div>
            <p className="mt-1 text-4xl font-extrabold text-foreground">
              {weather.loading ? "—" : geo.denied ? "—" : `${weather.temperature}°C`}
            </p>
            <p className="text-xs text-muted-foreground">
              {weather.loading
                ? "Fetching weather…"
                : geo.denied
                ? "Allow location for live weather"
                : describeWeather(weather.weatherCode)}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
            <p className="font-bold text-foreground">Quick Actions</p>
            <div className="mt-3 space-y-2.5">
              {isBuyer ? (
                <AddBuyerDemandDialog
                  availableFarmerListings={data.allListings ?? []}
                  buyerName={data.profile.full_name}
                  phone={data.profile.phone}
                  county={data.profile.county}
                >
                  <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-left transition-colors hover:bg-secondary">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-white">
                      <ShoppingBag className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">Post Waste Demand</span>
                  </button>
                </AddBuyerDemandDialog>
              ) : (
                <AddListingDialog />
              )}
              <QuickLink to="/marketplace" Icon={Search} label="Marketplace & Demands" />
              <QuickLink to="/map" Icon={MapPin} label="View Map" />
              <QuickLink
                to="/messages"
                Icon={Mail}
                label="Check Messages"
                badge={unreadCount > 0 ? unreadCount : undefined}
              />
            </div>
          </div>

          {/* Recent Activities Box */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Recent Activities</h3>
                  <p className="text-[11px] text-muted-foreground">Listings & buyer enquiries</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>

            <div className="space-y-2.5">
              {recentActivities.map((act) => (
                <Link
                  key={act.id}
                  to={act.link as any}
                  className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-2.5 transition-all hover:border-border hover:bg-secondary/70"
                >
                  <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${act.iconBg}`}>
                    <act.icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                        {act.title}
                      </p>
                      <span className="flex-shrink-0 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                        {act.timeFormatted}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-1">
                      <p className="truncate text-[11px] text-muted-foreground">
                        {act.subtitle}
                      </p>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${act.tagColor}`}>
                        {act.tag}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {recentActivities.length === 0 && (
                <div className="py-6 text-center">
                  <Clock className="mx-auto mb-1 h-6 w-6 text-muted-foreground/50" />
                  <p className="text-xs font-medium text-muted-foreground">
                    No recent activity yet
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                    Your waste listings & buyer enquiries will show here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  Icon,
  label,
  value,
  sub,
  accent = "primary",
  badge,
  progress,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  accent?: "primary" | "forest" | "amber" | "blue";
  badge?: string;
  progress?: number;
}) {
  const accentStyles = {
    primary: {
      iconBg: "bg-primary/10 text-primary border-primary/20",
      pill: "bg-primary/10 text-primary border-primary/20",
      topBar: "from-primary/60 to-primary/10",
    },
    forest: {
      iconBg: "bg-forest/15 text-forest border-forest/20",
      pill: "bg-forest/15 text-forest border-forest/20",
      topBar: "from-forest/70 to-forest/15",
    },
    amber: {
      iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
      pill: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
      topBar: "from-amber-500/70 to-amber-500/15",
    },
    blue: {
      iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
      pill: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20",
      topBar: "from-blue-500/70 to-blue-500/15",
    },
  }[accent];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4.5 shadow-xs transition-all hover:shadow-md hover:border-border/80">
      {/* Top micro-gradient border line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentStyles.topBar}`} />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${accentStyles.iconBg}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
          <p className="text-xs font-bold text-muted-foreground">{label}</p>
        </div>
        {badge && (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${accentStyles.pill}`}>
            {badge}
          </span>
        )}
      </div>

      <p className="mt-3 text-2xl font-black text-foreground tracking-tight">{value}</p>

      <p className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
        <span>{sub}</span>
      </p>

      {progress !== undefined && (
        <div className="mt-2.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              accent === "amber"
                ? "bg-amber-500"
                : accent === "forest"
                ? "bg-forest"
                : accent === "blue"
                ? "bg-blue-500"
                : "bg-primary"
            }`}
            style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}

function QuickLink({
  to,
  Icon,
  label,
  badge,
}: {
  to: "/marketplace" | "/map" | "/messages";
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number | undefined;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3 transition-colors hover:bg-secondary"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Icon className="h-4.5 w-4.5" />
        {badge != null && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-xs animate-pulse">
            {badge}
          </span>
        )}
      </span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}
