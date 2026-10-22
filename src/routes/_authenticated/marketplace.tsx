import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, BadgeCheck, MessageSquare } from "lucide-react";
import { getBuyers } from "@/lib/marketplace.functions";
import type { Buyer } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Find Buyers | Takathamani" },
      {
        name: "description",
        content: "Discover verified buyers for your agricultural waste on Takathamani.",
      },
      { property: "og:title", content: "Marketplace — Find Buyers | Takathamani" },
      { property: "og:description", content: "Discover verified buyers for your agricultural waste." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketplacePage,
});

const FILTERS = ["All", "Maize Cobs", "Rice Husk", "Bagasse", "Other"];

function matchesFilter(buyer: Buyer, filter: string): boolean {
  if (filter === "All") return true;
  if (filter === "Other") {
    return buyer.buys.some(
      (b) => !["Maize Cobs", "Rice Husk", "Sugarcane Bagasse"].includes(b),
    );
  }
  if (filter === "Bagasse") return buyer.buys.includes("Sugarcane Bagasse");
  return buyer.buys.includes(filter);
}

function MarketplacePage() {
  const getBuyersFn = useServerFn(getBuyers);
  const { data, isLoading } = useQuery({ queryKey: ["buyers"], queryFn: () => getBuyersFn() });
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const buyers = (data ?? []).filter(
    (b) =>
      matchesFilter(b, filter) &&
      (b.company_name + b.producer_type + b.county).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Marketplace — Find Buyers</h1>
        <p className="text-sm text-muted-foreground">
          Discover verified buyers for your agricultural waste.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search waste type, location, or buyer..."
          aria-label="Search buyers"
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
                ? "bg-forest text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && <p className="py-10 text-center text-sm text-muted-foreground">Loading buyers...</p>}

      <div className="space-y-4">
        {buyers.map((b) => (
          <div
            key={b.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-bold text-primary">
              {b.company_name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-foreground">{b.company_name}</p>
                {b.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">{b.producer_type}</p>
              <p className="mt-1 text-sm text-foreground">
                <span className="font-semibold">Buy:</span> {b.buys.join(", ")}
              </p>
              <p className="text-xs text-muted-foreground">Location: {b.location}</p>
              <p className="mt-1 text-sm font-bold text-primary">
                KSh {b.price_min.toLocaleString("en-KE")} - {b.price_max.toLocaleString("en-KE")}/ton
              </p>
            </div>
            <button
              onClick={() =>
                toast.success(`Contact request sent to ${b.company_name}`, {
                  description: "They will reach you on your registered phone number.",
                })
              }
              className="flex items-center gap-2 self-start rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 sm:self-center"
            >
              <MessageSquare className="h-4 w-4" />
              Contact
            </button>
          </div>
        ))}
        {!isLoading && buyers.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No buyers match your search yet.
          </p>
        )}
      </div>
    </div>
  );
}
