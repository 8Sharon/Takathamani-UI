import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Clock, Trash2, ShoppingBag, Package, MapPin } from "lucide-react";
import { getDashboard, deleteListing } from "@/lib/marketplace.functions";
import { listingImage, resolveWasteImage } from "@/lib/waste-images";
import { timeAgo } from "@/lib/types";
import { AddListingDialog } from "@/components/add-listing-dialog";
import { AddBuyerDemandDialog } from "@/components/add-buyer-demand-dialog";
import { useBuyerDemands, deleteBuyerDemand } from "@/lib/buyer-demands";

export const Route = createFileRoute("/_authenticated/listings")({
  head: () => ({
    meta: [
      { title: "My Listings — Takathamani" },
      { name: "description", content: "Manage the agricultural waste listings and purchase requests on Takathamani." },
      { property: "og:title", content: "My Listings — Takathamani" },
      { property: "og:description", content: "Manage your agricultural waste listings and purchase requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListingsPage,
});

function ListingsPage() {
  const getDash = useServerFn(getDashboard);
  const remove = useServerFn(deleteListing);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const buyerDemands = useBuyerDemands();
  const queryClient = useQueryClient();

  if (isLoading || !data) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Loading listings...</p>;
  }

  const isBuyer = data.role === "buyer";

  // Filter demands belonging to this buyer (both local and database listings)
  const dbDemandsAsBuyer = isBuyer
    ? data.listings.map((l) => ({
        id: l.id,
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
        notes: undefined as string | undefined,
        isFromDb: true,
      }))
    : [];

  const storedDemands = buyerDemands.filter(
    (d) =>
      d.buyer_id === "current-buyer" ||
      d.phone === data.profile.phone ||
      d.buyer_name.toLowerCase() === data.profile.full_name.toLowerCase()
  );

  const myDemands = [...storedDemands, ...dbDemandsAsBuyer];

  async function handleDeleteListing(id: string) {
    await remove({ data: { id } });
    toast.success("Waste listing removed");
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["all-listings"] });
  }

  async function handleDeleteDemand(demand: { id: string; isFromDb?: boolean }) {
    if (demand.isFromDb) {
      await remove({ data: { id: demand.id } });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["all-listings"] });
    } else {
      deleteBuyerDemand(demand.id);
    }
    toast.success("Purchase demand removed");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {isBuyer ? "My Purchase Listings (Waste Demands)" : "My Waste Listings"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isBuyer
              ? "Manage the waste materials and specifications you have requested from farmers."
              : "Everything you've made available for buyers across Kenya to source."}
          </p>
        </div>

        <div>
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

      {/* BUYER LISTINGS VIEW */}
      {isBuyer ? (
        <div className="space-y-4">
          {myDemands.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">No purchase listings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Post your agricultural waste requirements so smallholder farmers can supply you directly.
              </p>
            </div>
          )}

          {myDemands.map((d) => {
            const img = d.image_url || resolveWasteImage(d.waste_type).url;
            return (
              <div
                key={d.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center transition-all hover:border-forest/40"
              >
                <img
                  src={img}
                  alt={d.waste_type}
                  className="h-24 w-full rounded-xl object-cover sm:w-32"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground text-base">{d.waste_type}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-forest/15 border border-forest/30 px-2.5 py-0.5 text-xs font-bold text-forest">
                      <CheckCircle2 className="h-3 w-3" /> Active Demand
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {d.quantity_tons} Tons needed · Budget: KSh {d.price_per_ton.toLocaleString("en-KE")}/ton
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {d.location || d.county} County · Requested {timeAgo(d.created_at)}
                  </p>
                  {d.notes && (
                    <p className="mt-1 text-xs text-muted-foreground italic">"{d.notes}"</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteDemand(d)}
                  aria-label={`Delete ${d.waste_type} demand`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive self-end sm:self-center shrink-0"
                  title="Remove this purchase listing"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* FARMER LISTINGS VIEW */
        <div className="space-y-4">
          {data.listings.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">No listings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first agricultural waste listing to start reaching buyers.
              </p>
            </div>
          )}

          {data.listings.map((l) => (
            <div
              key={l.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center transition-all hover:border-primary/40"
            >
              <img
                src={listingImage(l)}
                alt={l.waste_type}
                loading="lazy"
                className="h-24 w-full rounded-xl object-cover sm:w-32"
                width={816}
                height={816}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">{l.waste_type}</p>
                  {l.status === "available" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {l.status}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {l.quantity_tons} Tons · KSh {l.price_per_ton.toLocaleString("en-KE")}/ton
                </p>
                <p className="text-sm text-muted-foreground">
                  {l.location}, {l.county} County · Listed {timeAgo(l.created_at)}
                </p>
              </div>
              <button
                onClick={() => handleDeleteListing(l.id)}
                aria-label={`Delete ${l.waste_type} listing`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive self-end sm:self-center shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
