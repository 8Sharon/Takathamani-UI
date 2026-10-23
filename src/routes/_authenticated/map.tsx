import { createFileRoute } from "@tanstack/react-router";
import { useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy-load the real Leaflet map to avoid SSR issues
const ListingMap = lazy(() => import("@/components/listing-map"));

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Map & Collection Routes — Takathamani" },
      {
        name: "description",
        content: "See nearby listings, buyers and distances on an interactive Leaflet map.",
      },
      { property: "og:title", content: "Map & Collection Routes — Takathamani" },
      { property: "og:description", content: "Nearby listings, buyers and distances on a live map." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <span className="text-primary">🗺️</span> Agricultural Waste & Logistics Map
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Discover verified crop residue listings from Kenyan farmers and active buyer facilities.
            Click on any listing or demand to calculate the exact distance in between.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex h-[520px] items-center justify-center rounded-3xl border border-border bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <ListingMap selectedId={selectedId} onSelect={setSelectedId} />
      </Suspense>
    </div>
  );
}
