import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Tag,
  Boxes,
  MapPin,
  BadgeDollarSign,
  ShieldCheck,
  X,
  Star,
  BadgeCheck,
  ChevronLeft,
} from "lucide-react";
import { getBuyers, getDashboard } from "@/lib/marketplace.functions";
import type { Buyer } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/smart-matching")({
  head: () => ({
    meta: [
      { title: "Smart Matching — AI Powered | Takathamani" },
      {
        name: "description",
        content: "Our AI matches your agricultural waste with the best buyers by type, quantity, location, price and quality.",
      },
      { property: "og:title", content: "Smart Matching — AI Powered | Takathamani" },
      { property: "og:description", content: "AI matches your waste with the best buyers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SmartMatchingPage,
});

const CRITERIA = [
  { Icon: Tag, label: "Type" },
  { Icon: Boxes, label: "Quantity" },
  { Icon: MapPin, label: "Location" },
  { Icon: BadgeDollarSign, label: "Price" },
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
  const buyersQ = useQuery({ queryKey: ["buyers"], queryFn: () => getBuyersFn() });
  const dashQ = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });

  if (buyersQ.isLoading || dashQ.isLoading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Matching your waste...</p>;
  }

  const listing = dashQ.data?.listings.find((l) => l.status === "available") ?? dashQ.data?.listings[0];
  const wasteType = listing?.waste_type ?? "your waste";

  const scored: Buyer[] = [...(buyersQ.data ?? [])].sort(
    (a, b) => Number(b.rating) - Number(a.rating),
  );
  const best = scored[0];
  const others = scored.slice(1);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-foreground">
          <ChevronLeft className="hidden h-6 w-6 text-muted-foreground sm:block" />
          Smart Matching — AI Powered
        </h1>
        <p className="text-sm text-muted-foreground">
          Our AI matches your waste with the best buyers based on:
        </p>
      </div>

      <div className="flex justify-between gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {CRITERIA.map((c) => (
          <div key={c.label} className="flex flex-col items-center gap-1.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <c.Icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground">{c.label}</span>
          </div>
        ))}
      </div>

      {best && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-foreground">Best Match for Your {wasteType}</p>
            <button aria-label="Dismiss match" className="text-muted-foreground hover:text-foreground">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-xl font-bold text-primary">
              {best.company_name.slice(0, 1)}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-lg font-bold text-foreground">{best.company_name}</p>
                {best.verified && <BadgeCheck className="h-4.5 w-4.5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">
                {best.producer_type} · {DISTANCES[best.company_name] ?? 50} km
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-foreground">
                <Star className="h-4 w-4 fill-gold text-gold" />
                <span className="font-semibold">{Number(best.rating).toFixed(1)}</span>
                <span className="text-muted-foreground">({best.reviews} reviews)</span>
              </p>
            </div>
            <p className="text-xl font-extrabold text-primary">
              KSh {best.price_max.toLocaleString("en-KE")}
              <span className="text-xs font-semibold text-muted-foreground">/ton</span>
            </p>
          </div>
          <button
            onClick={() =>
              toast.success(`Match accepted — ${best.company_name} has been notified`, {
                description: "Expect a call or message within 24 hours.",
              })
            }
            className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            Accept Match
          </button>
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-bold text-muted-foreground">Other Matches</p>
        <div className="space-y-3">
          {others.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-lg font-bold text-primary">
                {b.company_name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">{b.company_name}</p>
                <p className="text-sm text-muted-foreground">
                  KSh {b.price_max.toLocaleString("en-KE")}/ton ·{" "}
                  {DISTANCES[b.company_name] ?? 50} km
                </p>
              </div>
              <button
                onClick={() =>
                  toast.info(`${b.company_name} match opened`, {
                    description: `They buy ${b.buys.join(", ")}.`,
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
