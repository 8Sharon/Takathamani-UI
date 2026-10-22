import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Navigation, Timer, Play, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Map & Collection Routes — Takathamani" },
      {
        name: "description",
        content: "See nearby listings, buyers and optimized collection routes on Takathamani.",
      },
      { property: "og:title", content: "Map & Collection Routes — Takathamani" },
      { property: "og:description", content: "Nearby listings, buyers and optimized collection routes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

const ROUTE_STOPS = [
  { name: "Farm A", distance: "5 km" },
  { name: "Farm B", distance: "8 km" },
  { name: "Farm C", distance: "15 km" },
];

function MapPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Map & Collection Routes</h1>
        <p className="text-sm text-muted-foreground">
          See nearby listings, buyers and optimized collection routes.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="relative">
          <svg viewBox="0 0 800 420" className="h-[420px] w-full" role="img" aria-label="Illustrated collection map of Nakuru">
            <rect width="800" height="420" fill="#EAF3E2" />
            <path d="M0 300 Q200 260 400 290 T800 270 V420 H0 Z" fill="#DCEBCB" />
            <path d="M60 0 Q120 150 80 420" stroke="#F5F0E1" strokeWidth="26" fill="none" strokeLinecap="round" />
            <path d="M0 120 Q300 90 800 150" stroke="#F5F0E1" strokeWidth="22" fill="none" />
            <path d="M700 40 Q640 200 720 420" stroke="#F5F0E1" strokeWidth="18" fill="none" />
            <path d="M120 140 Q260 200 420 180 Q560 165 660 220" stroke="#3B82F6" strokeWidth="5" strokeDasharray="14 10" fill="none" strokeLinecap="round" />
            <circle cx="140" cy="150" r="12" fill="#16A34A" stroke="#fff" strokeWidth="3" />
            <circle cx="420" cy="180" r="12" fill="#16A34A" stroke="#fff" strokeWidth="3" />
            <circle cx="655" cy="220" r="12" fill="#16A34A" stroke="#fff" strokeWidth="3" />
            <circle cx="260" cy="105" r="11" fill="#2563EB" stroke="#fff" strokeWidth="3" />
            <circle cx="540" cy="120" r="11" fill="#2563EB" stroke="#fff" strokeWidth="3" />
            <path d="M340 250 c-12 0 -20 8 -20 19 0 14 20 31 20 31 s20 -17 20 -31 c0 -11 -8 -19 -20 -19z" fill="#F97316" stroke="#fff" strokeWidth="3" />
            <path d="M580 280 c-12 0 -20 8 -20 19 0 14 20 31 20 31 s20 -17 20 -31 c0 -11 -8 -19 -20 -19z" fill="#F97316" stroke="#fff" strokeWidth="3" />
            <text x="400" y="395" textAnchor="middle" fontSize="22" fontWeight="700" fill="#57624F">Nakuru</text>
            <text x="105" y="95" fontSize="13" fill="#6B7A5E">Emenngut</text>
            <text x="600" y="70" fontSize="13" fill="#6B7A5E">Emenngut</text>
            <text x="720" y="330" fontSize="13" fill="#6B7A5E">Free Area</text>
          </svg>

          <div className="absolute left-4 top-4 rounded-2xl bg-card/95 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Timer className="h-4 w-4 text-primary" />
              Collection Route
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimated <span className="font-bold text-foreground">45 km</span> ·{" "}
              <span className="font-bold text-foreground">2.5 hrs</span>
            </p>
          </div>

          <div className="absolute right-4 top-4 rounded-2xl bg-card/95 p-4 text-xs shadow-lg backdrop-blur">
            <p className="mb-2 font-bold text-foreground">Legend</p>
            {[
              { c: "bg-primary", label: "Farm Listings" },
              { c: "bg-[#2563EB]", label: "Buyers" },
              { c: "bg-[#3B82F6]", label: "Collection Route" },
              { c: "bg-[#F97316]", label: "Pickup Points" },
            ].map((i) => (
              <div key={i.label} className="flex items-center gap-2 py-0.5 text-muted-foreground">
                <span className={`h-2.5 w-2.5 rounded-full ${i.c}`} />
                {i.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 p-5 sm:flex-row">
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-bold text-foreground">Optimized Route</p>
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {ROUTE_STOPS.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-semibold text-foreground">
                    {s.name} · <span className="font-normal text-muted-foreground">{s.distance}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => toast.success("Route started", { description: "Navigation is guiding you to Farm A." })}
            className="flex h-fit items-center justify-center gap-2 self-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Play className="h-4 w-4" />
            Start Route
          </button>
        </div>
      </div>
    </div>
  );
}
