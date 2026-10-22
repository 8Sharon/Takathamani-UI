import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Clock, Trash2 } from "lucide-react";
import { getDashboard, deleteListing } from "@/lib/marketplace.functions";
import { wasteImage } from "@/lib/waste-images";
import { timeAgo } from "@/lib/types";
import { AddListingDialog } from "@/components/add-listing-dialog";

export const Route = createFileRoute("/_authenticated/listings")({
  head: () => ({
    meta: [
      { title: "My Listings — Takathamani" },
      { name: "description", content: "Manage the agricultural waste you have listed on Takathamani." },
      { property: "og:title", content: "My Listings — Takathamani" },
      { property: "og:description", content: "Manage your agricultural waste listings." },
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
  const queryClient = useQueryClient();

  if (isLoading || !data) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Loading listings...</p>;
  }

  async function handleDelete(id: string) {
    await remove({ data: { id } });
    toast.success("Listing removed");
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My Listings</h1>
          <p className="text-sm text-muted-foreground">
            Everything you've made available to buyers.
          </p>
        </div>
        <AddListingDialog>
          <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            + Add New Listing
          </button>
        </AddListingDialog>
      </div>

      {data.listings.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold text-foreground">No listings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first agricultural waste listing to start reaching buyers.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {data.listings.map((l) => (
          <div
            key={l.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <img
              src={wasteImage(l.waste_type)}
              alt={l.waste_type}
              loading="lazy"
              className="h-24 w-full rounded-xl object-cover sm:w-32"
              width={816}
              height={816}
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
              onClick={() => handleDelete(l.id)}
              aria-label={`Delete ${l.waste_type} listing`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
