import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Wallet,
  Recycle,
  Sprout,
  ChevronRight,
  Sun,
  CloudSun,
  Cloud,
  Search,
  MapPin,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { getDashboard } from "@/lib/marketplace.functions";
import { wasteImage } from "@/lib/waste-images";
import { timeAgo } from "@/lib/types";
import { AddListingDialog } from "@/components/add-listing-dialog";
import bannerImg from "@/assets/smart-matching-banner.png";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Takathamani" },
      {
        name: "description",
        content: "Your Takathamani farmer dashboard: listings, earnings, impact and smart matches.",
      },
      { property: "og:title", content: "Dashboard — Takathamani" },
      { property: "og:description", content: "Listings, earnings, impact and smart matches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const FORECAST = [
  { day: "Today", hi: 22, lo: 12, Icon: CloudSun },
  { day: "Tomorrow", hi: 24, lo: 13, Icon: Sun },
  { day: "Wed", hi: 22, lo: 11, Icon: Cloud },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function DashboardPage() {
  const getDash = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });

  if (isLoading || !data) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Loading your dashboard...</p>;
  }

  const firstName = data.profile.full_name.split(" ")[0];
  const earnings = data.transactions.reduce((s, t) => s + t.amount, 0);
  const tons = data.transactions.reduce((s, t) => s + t.tons, 0);
  const co2 = tons * 2.33;
  const matches = data.listings.length > 0 ? 2 : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {greeting()}, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Let's turn your agricultural waste into value!
          </p>
        </div>
        <Link
          to="/listings"
          className="flex items-center text-sm font-semibold text-primary hover:underline"
        >
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard Icon={Package} label="My Listings" value={String(data.listings.length)} sub="Active listings" />
        <StatCard Icon={Wallet} label="Total Earnings" value={`KSh ${earnings.toLocaleString("en-KE")}`} sub="All-time" highlight />
        <StatCard Icon={Recycle} label="Waste Recovered" value={`${tons.toFixed(1)} Tons`} sub="Environmental impact" />
        <StatCard Icon={Sprout} label="CO₂ Avoided" value={`${co2.toFixed(1)} Tons`} sub="Estimated" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Link
            to="/smart-matching"
            className="group relative block overflow-hidden rounded-3xl bg-forest p-6 text-primary-foreground"
          >
            <div className="relative z-10 max-w-[60%]">
              <h2 className="text-xl font-extrabold">Smart Matching</h2>
              <p className="mt-1 text-sm text-primary-foreground/80">
                We've found {matches} buyers interested in your maize cobs!
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold transition-colors group-hover:bg-primary/90">
                View Matches <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
            <img
              src={bannerImg}
              alt=""
              loading="lazy"
              className="pointer-events-none absolute -right-4 bottom-0 top-0 my-auto h-full w-auto object-contain opacity-95"
              width={1152}
              height={576}
            />
          </Link>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Recent Listings</h2>
              <Link to="/listings" className="text-sm font-semibold text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {data.listings.slice(0, 3).map((l) => (
                <div key={l.id} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                  <img
                    src={wasteImage(l.waste_type)}
                    alt={l.waste_type}
                    loading="lazy"
                    className="h-28 w-full rounded-xl object-cover"
                    width={816}
                    height={816}
                  />
                  <p className="mt-2.5 text-sm font-bold text-foreground">{l.waste_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.quantity_tons} Tons · KSh {l.price_per_ton.toLocaleString("en-KE")}/ton
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {l.location} · {timeAgo(l.created_at)}
                  </p>
                  <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Available
                  </span>
                </div>
              ))}
              {data.listings.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No listings yet — add your first one from Quick Actions.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="font-bold text-foreground">Nakuru</p>
              <Sun className="h-6 w-6 text-gold" />
            </div>
            <p className="mt-1 text-4xl font-extrabold text-foreground">22°C</p>
            <p className="text-xs text-muted-foreground">Partly cloudy</p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
              {FORECAST.map(({ day, hi, lo, Icon }) => (
                <div key={day}>
                  <p className="text-[11px] font-semibold text-muted-foreground">{day}</p>
                  <Icon className="mx-auto my-1 h-4.5 w-4.5 text-gold" />
                  <p className="text-[11px] text-foreground">
                    {hi}°/<span className="text-muted-foreground">{lo}°</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="font-bold text-foreground">Quick Actions</p>
            <div className="mt-3 space-y-2.5">
              <AddListingDialog />
              <QuickLink to="/marketplace" Icon={Search} label="Find Buyers" />
              <QuickLink to="/map" Icon={MapPin} label="View Map" />
              <QuickLink
                to="/messages"
                Icon={Mail}
                label="Check Messages"
                badge={data.unreadMessages > 0 ? data.unreadMessages : undefined}
              />
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
  highlight,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
      <p
        className={`mt-3 text-2xl font-extrabold ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{sub}</p>
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
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3 transition-colors hover:bg-secondary"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Icon className="h-4.5 w-4.5" />
        {badge != null && (
          <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-foreground">
            {badge}
          </span>
        )}
      </span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}
