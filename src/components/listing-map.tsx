import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Crosshair,
  Map as MapIcon,
  Navigation,
  Satellite,
  Phone,
  User,
  ShoppingBag,
  Layers,
  Search,
  CheckCircle2,
  Package,
  Truck,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Building2,
  PlusCircle,
} from "lucide-react";
import { getBuyers, getDashboard, getAllListings } from "@/lib/marketplace.functions";
import { DEFAULT_COUNTY, countyCoords, type County } from "@/lib/kenya-counties";
import { formatDistance, haversineKm, pointForId, type LatLng } from "@/lib/geo";
import { listingImage, resolveWasteImage } from "@/lib/waste-images";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useBuyerDemands } from "@/lib/buyer-demands";
import { resolveFarmerForListing, useActiveFarmerAccount } from "@/lib/farmer-accounts";
import { SendMessageDialog } from "@/components/send-message-dialog";
import { type Buyer, type Listing, type BuyerDemand, wasteTypesMatch } from "@/lib/types";

type Layer = "normal" | "satellite";

const TILES: Record<Layer, { url: string; attribution: string; maxZoom: number }> = {
  normal: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
};

function pinIcon(color: string, label: string, size = 32, isSelected = false): L.DivIcon {
  const border = isSelected ? "3px solid #ffffff" : "2px solid #ffffff";
  const shadow = isSelected
    ? "0 0 0 4px rgba(16,185,129,0.45), 0 4px 14px rgba(0,0,0,0.55)"
    : "0 3px 8px rgba(0,0,0,0.35)";
  const scale = isSelected ? "scale(1.18)" : "scale(1)";

  return L.divIcon({
    className: "",
    html: `<div style="transform:${scale};transition:transform .2s ease;width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform-origin:bottom left;transform:rotate(-45deg);background:${color};border:${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:#fff;font:800 ${Math.round(
      size / 2.2
    )}px system-ui,sans-serif;line-height:1">${label}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function distanceIcon(text: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-50%);background:#061d10;color:#34d399;border:2px solid #10b981;border-radius:999px;padding:4px 12px;font:800 12px system-ui,sans-serif;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.6);display:flex;align-items:center;gap:4px"><span>📍 ${text}</span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function FitToPoints({ points, nonce }: { points: LatLng[]; nonce: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const firstPoint = points[0];
    if (points.length === 1 && firstPoint) {
      map.setView([firstPoint.lat, firstPoint.lng], 10, { animate: true });
      return;
    }
    map.fitBounds(
      L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
      { padding: [60, 60], animate: true, maxZoom: 12 }
    );
  }, [map, nonce]);
  return null;
}

export default function ListingMap({
  selectedId: controlledSelectedId,
  onSelect: controlledOnSelect,
}: {
  selectedId?: string | undefined;
  onSelect?: (id: string) => void;
}) {
  const getDash = useServerFn(getDashboard);
  const getAllListingsFn = useServerFn(getAllListings);
  const getBuyersFn = useServerFn(getBuyers);
  const geolocation = useGeolocation();
  const activeFarmer = useActiveFarmerAccount();
  const buyerDemands = useBuyerDemands();

  const { data: dashData } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const { data: allListingsData } = useQuery({ queryKey: ["all-listings"], queryFn: () => getAllListingsFn() });
  const { data: buyers } = useQuery({ queryKey: ["buyers"], queryFn: () => getBuyersFn() });

  const isBuyer = dashData?.role === "buyer";
  const isFarmer = !isBuyer;

  const [layer, setLayer] = useState<Layer>("normal");
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [search, setSearch] = useState("");
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  // All farmer listings across Kenya
  const allListings: Listing[] = useMemo(() => {
    return allListingsData ?? dashData?.allListings ?? [];
  }, [allListingsData, dashData]);

  // Farmer's own listings
  const farmerOwnListings: Listing[] = useMemo(() => {
    return dashData?.listings ?? [];
  }, [dashData]);

  // Buyer's own demands (both localStorage demands and database-backed listings)
  const dbDemandsAsBuyer: BuyerDemand[] = useMemo(() => {
    if (!isBuyer || !dashData) return [];
    return (dashData.listings ?? []).map((l) => ({
      id: `demand-db-${l.id}`,
      buyer_id: "current-buyer",
      buyer_name: dashData.profile.full_name || "Buyer",
      company_name: dashData.profile.full_name || "Buyer Enterprise",
      phone: dashData.profile.phone || "",
      waste_type: l.waste_type,
      quantity_tons: l.quantity_tons,
      price_per_ton: l.price_per_ton,
      county: l.county,
      location: l.location,
      created_at: l.created_at,
      status: "active" as const,
      image_url: l.image_url,
    }));
  }, [isBuyer, dashData]);

  const storedBuyerDemands = useMemo(() => {
    if (!dashData) return [];
    return buyerDemands.filter(
      (d) =>
        d.buyer_id === "current-buyer" ||
        (dashData.profile.phone && d.phone === dashData.profile.phone) ||
        (dashData.profile.full_name && d.buyer_name?.toLowerCase() === dashData.profile.full_name.toLowerCase())
    );
  }, [buyerDemands, dashData]);

  const myBuyerDemands: BuyerDemand[] = useMemo(() => {
    const combined = [...storedBuyerDemands, ...dbDemandsAsBuyer];
    // If the logged-in buyer has created demands, use their demands; otherwise fallback to active demands so the view is never empty
    return combined.length > 0 ? combined : buyerDemands;
  }, [storedBuyerDemands, dbDemandsAsBuyer, buyerDemands]);

  const hasCustomDemands = storedBuyerDemands.length > 0 || dbDemandsAsBuyer.length > 0;
  const hasCustomFarmerListings = farmerOwnListings.length > 0;

  // Active items for the primary "mine" list:
  // For Farmer: farmer's own listings
  // For Buyer: buyer's own demands
  const mineItems = useMemo(() => {
    if (isFarmer) {
      return farmerOwnListings.length > 0 ? farmerOwnListings : allListings;
    } else {
      return myBuyerDemands;
    }
  }, [isFarmer, farmerOwnListings, allListings, myBuyerDemands]);

  // Filtered displayed items based on current tab and search query
  const displayedItems = useMemo(() => {
    const source = tab === "mine" ? mineItems : allListings;
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter((item) => {
      const type = "waste_type" in item ? item.waste_type : "";
      const county = "county" in item ? item.county : "";
      const loc = "location" in item ? item.location : "";
      return (type + county + loc).toLowerCase().includes(q);
    });
  }, [tab, mineItems, allListings, search]);

  // Determine currently selected item ID
  const activeItemId = controlledSelectedId ?? internalSelectedId ?? displayedItems[0]?.id ?? mineItems[0]?.id;

  function handleSelect(id: string) {
    setInternalSelectedId(id);
    controlledOnSelect?.(id);
  }

  // Precomputed points for commercial buyers
  const buyerPoints = useMemo(() => {
    return (buyers ?? []).map((b) => ({
      buyer: b,
      point: countyCoords(b.county) ?? DEFAULT_COUNTY,
    }));
  }, [buyers]);

  // Precomputed points for buyer demands
  const demandPoints = useMemo(() => {
    return buyerDemands.map((d) => {
      const baseCoords = countyCoords(d.county) ?? DEFAULT_COUNTY;
      const point = pointForId(baseCoords, d.id);
      return { demand: d, point };
    });
  }, [buyerDemands]);

  // Precomputed points for all farmer listings
  const allListingPoints = useMemo(() => {
    return allListings.map((l) => {
      const baseCoords = countyCoords(l.county) ?? DEFAULT_COUNTY;
      const point = pointForId(baseCoords, l.id);
      return { listing: l, point };
    });
  }, [allListings]);

  // ─────────────────────────────────────────────────────────────
  // SCENARIO A: FARMER ACCOUNT
  // The farmer views their own listing and finds the closest matching Buyer.
  // ─────────────────────────────────────────────────────────────
  const selectedFarmerListing: Listing | null = useMemo(() => {
    if (isBuyer) return null;
    const found = farmerOwnListings.find((l) => l.id === activeItemId);
    if (found) return found;
    const fallbackInAll = allListings.find((l) => l.id === activeItemId);
    return fallbackInAll ?? farmerOwnListings[0] ?? allListings[0] ?? null;
  }, [isBuyer, farmerOwnListings, allListings, activeItemId]);

  const selectedFarmerPoint = useMemo(() => {
    if (!selectedFarmerListing) return null;
    const base = countyCoords(selectedFarmerListing.county) ?? DEFAULT_COUNTY;
    return pointForId(base, selectedFarmerListing.id);
  }, [selectedFarmerListing]);

  // Closest matching Buyer for the selected Farmer listing
  const matchedBuyerTarget = useMemo(() => {
    if (!selectedFarmerListing || !selectedFarmerPoint) return null;
    const wasteType = selectedFarmerListing.waste_type;

    // 1. Check live buyer demands first
    const matchingDemands = demandPoints.filter((dp) =>
      wasteTypesMatch(dp.demand.waste_type, wasteType)
    );

    if (matchingDemands.length > 0) {
      const sorted = [...matchingDemands].sort(
        (a, b) =>
          haversineKm(selectedFarmerPoint, a.point) -
          haversineKm(selectedFarmerPoint, b.point)
      );
      const best = sorted[0];
      if (best) {
        return {
          type: "demand" as const,
          name: `${best.demand.company_name} (${best.demand.buyer_name})`,
          county: best.demand.county,
          location: best.demand.location || best.demand.county,
          point: best.point,
          targetPrice: best.demand.price_per_ton,
          quantity: best.demand.quantity_tons,
          phone: best.demand.phone,
        };
      }
    }

    // 2. Fall back to commercial buyers
    if (buyerPoints.length > 0) {
      const sorted = [...buyerPoints].sort((a, b) => {
        const aMatches = a.buyer.buys.some((w) => wasteTypesMatch(w, wasteType));
        const bMatches = b.buyer.buys.some((w) => wasteTypesMatch(w, wasteType));
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return (
          haversineKm(selectedFarmerPoint, a.point) -
          haversineKm(selectedFarmerPoint, b.point)
        );
      });
      const best = sorted[0];
      if (best) {
        return {
          type: "buyer" as const,
          name: best.buyer.company_name,
          county: best.buyer.county,
          location: best.buyer.location || best.buyer.county,
          point: best.point,
          targetPrice: best.buyer.price_max,
          quantity: 50,
          phone: "+254 722 100200",
        };
      }
    }

    return null;
  }, [selectedFarmerListing, selectedFarmerPoint, demandPoints, buyerPoints]);

  // ─────────────────────────────────────────────────────────────
  // SCENARIO B: BUYER ACCOUNT
  // The buyer views their own demand and finds the closest matching Farmer.
  // ─────────────────────────────────────────────────────────────
  const selectedBuyerDemand: BuyerDemand | null = useMemo(() => {
    if (isFarmer) return null;
    const found = myBuyerDemands.find((d) => d.id === activeItemId);
    return found ?? myBuyerDemands[0] ?? null;
  }, [isFarmer, myBuyerDemands, activeItemId]);

  const selectedBuyerPoint = useMemo(() => {
    if (!selectedBuyerDemand) return null;
    const base = countyCoords(selectedBuyerDemand.county) ?? DEFAULT_COUNTY;
    return pointForId(base, selectedBuyerDemand.id);
  }, [selectedBuyerDemand]);

  // Closest matching Farmer Listing for the selected Buyer Demand
  const matchedFarmerTarget = useMemo(() => {
    if (!selectedBuyerDemand || !selectedBuyerPoint || allListingPoints.length === 0) return null;
    const demandCrop = selectedBuyerDemand.waste_type;

    // Filter available farmer listings (excluding any created by the buyer themselves)
    const availablePoints = allListingPoints.filter(
      (lp) => lp.listing.farmer_id !== dashData?.profile.id
    );

    const matchCandidates = availablePoints.length > 0 ? availablePoints : allListingPoints;

    // Match by crop type first
    const matchingCropListings = matchCandidates.filter((lp) =>
      wasteTypesMatch(lp.listing.waste_type, demandCrop)
    );

    const candidates = matchingCropListings.length > 0 ? matchingCropListings : matchCandidates;

    // Sort by proximity to buyer's facility
    const sorted = [...candidates].sort(
      (a, b) =>
        haversineKm(selectedBuyerPoint, a.point) -
        haversineKm(selectedBuyerPoint, b.point)
    );

    const best = sorted[0];
    if (!best) return null;

    const resolvedFarmer = resolveFarmerForListing(best.listing, activeFarmer);

    return {
      listing: best.listing,
      name: resolvedFarmer.name,
      phone: resolvedFarmer.phone,
      county: best.listing.county,
      location: best.listing.location || best.listing.county,
      point: best.point,
      price: best.listing.price_per_ton,
      quantity: best.listing.quantity_tons,
    };
  }, [selectedBuyerDemand, selectedBuyerPoint, allListingPoints, dashData, activeFarmer]);

  // Unified distance calculation between Origin & Target
  const distanceBetweenKm = useMemo(() => {
    if (isFarmer) {
      if (!selectedFarmerPoint || !matchedBuyerTarget?.point) return null;
      return haversineKm(selectedFarmerPoint, matchedBuyerTarget.point);
    } else {
      if (!selectedBuyerPoint || !matchedFarmerTarget?.point) return null;
      return haversineKm(selectedBuyerPoint, matchedFarmerTarget.point);
    }
  }, [isFarmer, selectedFarmerPoint, matchedBuyerTarget, selectedBuyerPoint, matchedFarmerTarget]);

  const estimatedTransitText = useMemo(() => {
    if (distanceBetweenKm === null) return null;
    const mins = Math.round((distanceBetweenKm / 45) * 60);
    if (mins < 60) return `~${mins} mins haulage drive`;
    const hrs = (mins / 60).toFixed(1);
    return `~${hrs} hrs haulage drive`;
  }, [distanceBetweenKm]);

  // Focus points for auto-fitting the map view
  const focusPoints: LatLng[] = useMemo(() => {
    const pts: LatLng[] = [];
    if (geolocation.coords) pts.push(geolocation.coords);
    if (isFarmer) {
      if (selectedFarmerPoint) pts.push(selectedFarmerPoint);
      if (matchedBuyerTarget?.point) pts.push(matchedBuyerTarget.point);
      if (pts.length === 0 && farmerOwnListings.length > 0) {
        const base = countyCoords(farmerOwnListings[0]!.county) ?? DEFAULT_COUNTY;
        pts.push(base);
      }
    } else {
      if (selectedBuyerPoint) pts.push(selectedBuyerPoint);
      if (matchedFarmerTarget?.point) pts.push(matchedFarmerTarget.point);
      if (pts.length === 0 && myBuyerDemands.length > 0) {
        const base = countyCoords(myBuyerDemands[0]!.county) ?? DEFAULT_COUNTY;
        pts.push(base);
      }
    }
    return pts;
  }, [
    geolocation.coords,
    isFarmer,
    selectedFarmerPoint,
    matchedBuyerTarget,
    farmerOwnListings,
    selectedBuyerPoint,
    matchedFarmerTarget,
    myBuyerDemands,
  ]);

  const fitNonce = `${activeItemId ?? "none"}:${
    distanceBetweenKm !== null ? distanceBetweenKm.toFixed(1) : "0"
  }`;

  const defaultCenter: [number, number] = useMemo(() => {
    if (isFarmer && selectedFarmerPoint) return [selectedFarmerPoint.lat, selectedFarmerPoint.lng];
    if (isBuyer && selectedBuyerPoint) return [selectedBuyerPoint.lat, selectedBuyerPoint.lng];
    return [DEFAULT_COUNTY.lat, DEFAULT_COUNTY.lng];
  }, [isFarmer, selectedFarmerPoint, isBuyer, selectedBuyerPoint]);

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      {/* ── Left Control & Listings Panel ── */}
      <aside className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-2xl border border-border bg-card p-1 shadow-xs">
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              tab === "mine"
                ? "bg-forest text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isFarmer ? <Layers className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
            <span>
              {isFarmer
                ? `My Listings (${farmerOwnListings.length})`
                : `My Demands (${myBuyerDemands.length})`}
            </span>
          </button>
          <button
            onClick={() => setTab("all")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              tab === "all"
                ? "bg-forest text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Marketplace ({allListings.length})</span>
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isFarmer
                ? "Filter your listed waste..."
                : "Filter your purchase demands..."
            }
            className="w-full rounded-2xl border border-border bg-card pl-9 pr-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* ── Distance & Match Route Card ── */}
        {isFarmer && selectedFarmerListing && (
          <div className="rounded-3xl border border-emerald-500/30 bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5" /> Direct Route & Distance
              </span>
              <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                Farmer ➔ Buyer Match
              </span>
            </div>

            {/* Distance Banner */}
            <div className="rounded-2xl bg-forest p-3.5 text-white shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-200">Distance in Between</span>
                <span className="text-xs font-bold text-white/90">{estimatedTransitText}</span>
              </div>
              <p className="text-2xl font-black tracking-tight">
                {distanceBetweenKm !== null ? `${formatDistance(distanceBetweenKm)} apart` : "Calculating..."}
              </p>
              <p className="text-[11px] text-emerald-100/80 truncate">
                From My Farm ({selectedFarmerListing.location}, {selectedFarmerListing.county}) ➔{" "}
                {matchedBuyerTarget?.name || "Nearest Industrial Buyer"}
              </p>
            </div>

            {/* Origin (Farmer's Own Listing) */}
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  My Listing: {selectedFarmerListing.waste_type}
                </span>
                <span className="font-black text-primary">
                  KSh {selectedFarmerListing.price_per_ton.toLocaleString("en-KE")}/t
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span>{selectedFarmerListing.quantity_tons} Tons available</span>
                <span>{selectedFarmerListing.location}, {selectedFarmerListing.county}</span>
              </div>
            </div>

            {/* Destination (Matched Buyer) */}
            {matchedBuyerTarget && (
              <div className="rounded-xl border border-border/70 bg-secondary/30 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                    Buyer: {matchedBuyerTarget.name}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    Sourcing {selectedFarmerListing.waste_type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3 text-muted-foreground" /> Ready for haulage
                  </span>
                  <span>{matchedBuyerTarget.location}, {matchedBuyerTarget.county}</span>
                </div>
              </div>
            )}

            {/* Send Message to Buyer Action */}
            <div className="flex gap-2 pt-1">
              <SendMessageDialog
                listing={selectedFarmerListing}
                senderName={dashData?.profile.full_name || "Farmer"}
                senderPhone={dashData?.profile.phone}
                senderRole="farmer"
                recipientRole="buyer"
                recipientName={matchedBuyerTarget?.name || "Industrial Buyer"}
              >
                <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 px-3 text-xs font-bold text-white hover:bg-forest-deep transition-colors shadow-xs">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Send Message to Buyer</span>
                </button>
              </SendMessageDialog>

              {matchedBuyerTarget?.phone && (
                <a
                  href={`tel:${matchedBuyerTarget.phone}`}
                  className="flex items-center justify-center gap-1 rounded-xl border border-border bg-secondary px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
                  title={`Call ${matchedBuyerTarget.name}`}
                >
                  <Phone className="h-3.5 w-3.5 text-primary" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Buyer Distance & Match Route Card ── */}
        {isBuyer && selectedBuyerDemand && (
          <div className="rounded-3xl border border-blue-500/30 bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5" /> Direct Route & Distance
              </span>
              <span className="rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 border border-blue-500/30">
                Buyer ➔ Farmer Match
              </span>
            </div>

            {/* Distance Banner */}
            <div className="rounded-2xl bg-[#0b2447] p-3.5 text-white shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-200">Distance in Between</span>
                <span className="text-xs font-bold text-white/90">{estimatedTransitText}</span>
              </div>
              <p className="text-2xl font-black tracking-tight">
                {distanceBetweenKm !== null ? `${formatDistance(distanceBetweenKm)} apart` : "Calculating..."}
              </p>
              <p className="text-[11px] text-blue-100/80 truncate">
                From My Hub ({selectedBuyerDemand.location}, {selectedBuyerDemand.county}) ➔{" "}
                {matchedFarmerTarget ? `${matchedFarmerTarget.name} (${matchedFarmerTarget.location})` : "Nearby Farm"}
              </p>
            </div>

            {/* Origin (Buyer's Own Demand) */}
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                  My Demand: {selectedBuyerDemand.waste_type}
                </span>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  Target KSh {selectedBuyerDemand.price_per_ton.toLocaleString("en-KE")}/t
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span>Requesting {selectedBuyerDemand.quantity_tons} Tons</span>
                <span>{selectedBuyerDemand.location}, {selectedBuyerDemand.county}</span>
              </div>
            </div>

            {/* Destination (Matched Farmer) */}
            {matchedFarmerTarget && (
              <div className="rounded-xl border border-border/70 bg-secondary/30 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                    Farmer: {matchedFarmerTarget.name}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    KSh {matchedFarmerTarget.price.toLocaleString("en-KE")}/t
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                  <span>{matchedFarmerTarget.quantity} Tons ready for pickup</span>
                  <span>{matchedFarmerTarget.location}, {matchedFarmerTarget.county}</span>
                </div>
              </div>
            )}

            {/* Send Message to Farmer Action */}
            {matchedFarmerTarget && (
              <div className="flex gap-2 pt-1">
                <SendMessageDialog
                  listing={{
                    ...matchedFarmerTarget.listing,
                    farmer_name: matchedFarmerTarget.name,
                    farmer_phone: matchedFarmerTarget.phone,
                  }}
                  senderName={dashData?.profile.full_name || "Buyer"}
                  senderPhone={dashData?.profile.phone}
                  senderRole="buyer"
                  recipientRole="farmer"
                  recipientName={matchedFarmerTarget.name}
                >
                  <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 px-3 text-xs font-bold text-white hover:bg-forest-deep transition-colors shadow-xs">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Send Message to Farmer</span>
                  </button>
                </SendMessageDialog>

                {matchedFarmerTarget.phone && (
                  <a
                    href={`tel:${matchedFarmerTarget.phone}`}
                    className="flex items-center justify-center gap-1 rounded-xl border border-border bg-secondary px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
                    title={`Call Farmer ${matchedFarmerTarget.name}`}
                  >
                    <Phone className="h-3.5 w-3.5 text-primary" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Scrollable Listings / Demands Sidebar ── */}
        <div className="rounded-3xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-bold text-foreground">
              {tab === "mine"
                ? isFarmer
                  ? `My Listed Waste (${displayedItems.length})`
                  : `My Listed Demands (${displayedItems.length})`
                : `Marketplace Listings (${displayedItems.length})`}
            </span>
            <span className="text-[10px] text-muted-foreground">Select to view route</span>
          </div>

          {/* Prompt if user hasn't created items yet */}
          {tab === "mine" && isFarmer && !hasCustomFarmerListings && (
            <div className="mx-1 my-2 rounded-xl bg-secondary/70 p-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>You haven't listed any farm waste yet.</span>
              <Link to="/listings" className="text-primary font-bold hover:underline shrink-0">
                + Add Listing
              </Link>
            </div>
          )}

          {tab === "mine" && isBuyer && !hasCustomDemands && (
            <div className="mx-1 my-2 rounded-xl bg-secondary/70 p-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Showing active procurement demands.</span>
              <Link to="/listings" className="text-primary font-bold hover:underline shrink-0">
                + Add Demand
              </Link>
            </div>
          )}

          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
            {displayedItems.map((item) => {
              const active = item.id === activeItemId;
              const isListing = "farmer_id" in item;
              const isDemand = "buyer_name" in item || "company_name" in item;

              const title = item.waste_type;
              const price = item.price_per_ton;
              const tons = item.quantity_tons;
              const location = `${item.location}, ${item.county}`;
              const image = isListing ? listingImage(item as Listing) : resolveWasteImage(title).url;

              const subtitle = isDemand
                ? `${(item as BuyerDemand).company_name || (item as BuyerDemand).buyer_name} · ${location} (${tons}t)`
                : `${location} (${tons}t)`;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-2xl border p-2 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border bg-card hover:bg-secondary/50"
                  }`}
                >
                  <img
                    src={image}
                    alt={title}
                    className="h-11 w-11 shrink-0 rounded-xl object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-extrabold text-foreground">
                        {title}
                      </span>
                      <span className="text-[11px] font-black text-primary shrink-0 ml-1">
                        KSh {price.toLocaleString("en-KE")}/t
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                      {subtitle}
                    </p>
                  </div>
                </button>
              );
            })}

            {displayedItems.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No items match your search.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* ── Right Interactive Leaflet Map ── */}
      <div className="relative min-h-[520px] h-[660px] overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <MapContainer center={defaultCenter} zoom={7} scrollWheelZoom className="h-full w-full">
          <TileLayer
            key={layer}
            url={TILES[layer].url}
            attribution={TILES[layer].attribution}
            maxZoom={TILES[layer].maxZoom}
          />
          <FitToPoints points={focusPoints} nonce={fitNonce} />

          {/* User Location Marker */}
          {geolocation.coords && (
            <Marker
              position={[geolocation.coords.lat, geolocation.coords.lng]}
              icon={pinIcon("#F97316", "You", 34)}
            >
              <Tooltip direction="top">Your Location</Tooltip>
            </Marker>
          )}

          {/* ── FARMER MODE PINS ── */}
          {isFarmer && (
            <>
              {/* Farmer's Own Listings */}
              {(farmerOwnListings.length > 0 ? farmerOwnListings : allListings).map((l) => {
                const isSelected = selectedFarmerListing?.id === l.id;
                const base = countyCoords(l.county) ?? DEFAULT_COUNTY;
                const point = pointForId(base, l.id);

                return (
                  <Marker
                    key={l.id}
                    position={[point.lat, point.lng]}
                    icon={pinIcon(isSelected ? "#10B981" : "#059669", "🌾", isSelected ? 38 : 30, isSelected)}
                    eventHandlers={{ click: () => handleSelect(l.id) }}
                  >
                    <Tooltip direction="top">
                      <div className="text-xs font-sans">
                        <strong>My Listing: {l.waste_type}</strong>
                        <br />
                        <span>{l.quantity_tons} tons · KSh {l.price_per_ton.toLocaleString("en-KE")}/t</span>
                        <br />
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {isSelected ? "Currently Selected" : "Click to view distance to buyer"}
                        </span>
                      </div>
                    </Tooltip>
                  </Marker>
                );
              })}

              {/* Matched Buyer Pin */}
              {matchedBuyerTarget?.point && (
                <Marker
                  position={[matchedBuyerTarget.point.lat, matchedBuyerTarget.point.lng]}
                  icon={pinIcon("#2563EB", "🏢", 34, true)}
                >
                  <Tooltip direction="top" permanent={false}>
                    <div className="text-xs font-sans">
                      <strong>Buyer: {matchedBuyerTarget.name}</strong>
                      <br />
                      <span>Location: {matchedBuyerTarget.location}, {matchedBuyerTarget.county}</span>
                      <br />
                      <span className="text-[10px] text-blue-600 font-bold">
                        Interested in {selectedFarmerListing?.waste_type}
                      </span>
                    </div>
                  </Tooltip>
                </Marker>
              )}

              {/* Polyline Route from Farmer to Buyer */}
              {selectedFarmerPoint && matchedBuyerTarget?.point && distanceBetweenKm !== null && (
                <>
                  <Polyline
                    positions={[
                      [selectedFarmerPoint.lat, selectedFarmerPoint.lng],
                      [matchedBuyerTarget.point.lat, matchedBuyerTarget.point.lng],
                    ]}
                    pathOptions={{
                      color: "#10B981",
                      weight: 4,
                      dashArray: "8 8",
                      opacity: 0.9,
                    }}
                  />
                  <Marker
                    position={[
                      (selectedFarmerPoint.lat + matchedBuyerTarget.point.lat) / 2,
                      (selectedFarmerPoint.lng + matchedBuyerTarget.point.lng) / 2,
                    ]}
                    icon={distanceIcon(formatDistance(distanceBetweenKm))}
                    interactive={false}
                  />
                </>
              )}
            </>
          )}

          {/* ── BUYER MODE PINS ── */}
          {isBuyer && (
            <>
              {/* Buyer's Own Demands */}
              {myBuyerDemands.map((d) => {
                const isSelected = selectedBuyerDemand?.id === d.id;
                const base = countyCoords(d.county) ?? DEFAULT_COUNTY;
                const point = pointForId(base, d.id);

                return (
                  <Marker
                    key={d.id}
                    position={[point.lat, point.lng]}
                    icon={pinIcon(isSelected ? "#2563EB" : "#1D4ED8", "🏢", isSelected ? 38 : 30, isSelected)}
                    eventHandlers={{ click: () => handleSelect(d.id) }}
                  >
                    <Tooltip direction="top">
                      <div className="text-xs font-sans">
                        <strong>My Demand: {d.waste_type}</strong>
                        <br />
                        <span>Requesting {d.quantity_tons} tons @ KSh {d.price_per_ton.toLocaleString("en-KE")}/t</span>
                        <br />
                        <span className="text-[10px] text-blue-600 font-bold">
                          {isSelected ? "Currently Selected" : "Click to view distance to farmer"}
                        </span>
                      </div>
                    </Tooltip>
                  </Marker>
                );
              })}

              {/* Matched Farmer Listing Pin */}
              {matchedFarmerTarget?.point && (
                <Marker
                  position={[matchedFarmerTarget.point.lat, matchedFarmerTarget.point.lng]}
                  icon={pinIcon("#10B981", "🌾", 34, true)}
                >
                  <Tooltip direction="top" permanent={false}>
                    <div className="text-xs font-sans">
                      <strong>Farmer: {matchedFarmerTarget.name}</strong>
                      <br />
                      <span>{matchedFarmerTarget.quantity} tons available @ KSh {matchedFarmerTarget.price.toLocaleString("en-KE")}/t</span>
                      <br />
                      <span className="text-[10px] text-emerald-600 font-bold">
                        Supplying {selectedBuyerDemand?.waste_type}
                      </span>
                    </div>
                  </Tooltip>
                </Marker>
              )}

              {/* Polyline Route from Buyer to Farmer */}
              {selectedBuyerPoint && matchedFarmerTarget?.point && distanceBetweenKm !== null && (
                <>
                  <Polyline
                    positions={[
                      [selectedBuyerPoint.lat, selectedBuyerPoint.lng],
                      [matchedFarmerTarget.point.lat, matchedFarmerTarget.point.lng],
                    ]}
                    pathOptions={{
                      color: "#2563EB",
                      weight: 4,
                      dashArray: "8 8",
                      opacity: 0.9,
                    }}
                  />
                  <Marker
                    position={[
                      (selectedBuyerPoint.lat + matchedFarmerTarget.point.lat) / 2,
                      (selectedBuyerPoint.lng + matchedFarmerTarget.point.lng) / 2,
                    ]}
                    icon={distanceIcon(formatDistance(distanceBetweenKm))}
                    interactive={false}
                  />
                </>
              )}
            </>
          )}

          {/* User Location Polyline to active site */}
          {geolocation.coords && (isFarmer ? selectedFarmerPoint : selectedBuyerPoint) && (
            <Polyline
              positions={[
                [geolocation.coords.lat, geolocation.coords.lng],
                isFarmer
                  ? [selectedFarmerPoint!.lat, selectedFarmerPoint!.lng]
                  : [selectedBuyerPoint!.lat, selectedBuyerPoint!.lng],
              ]}
              pathOptions={{ color: "#F97316", weight: 2, dashArray: "4 6", opacity: 0.7 }}
            />
          )}
        </MapContainer>

        {/* Top-Right Map Layer Controls */}
        <div className="absolute right-3.5 top-3.5 z-[1000] flex gap-2">
          <button
            onClick={() => setLayer("normal")}
            aria-pressed={layer === "normal"}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-md backdrop-blur transition-colors ${
              layer === "normal"
                ? "bg-forest text-white"
                : "bg-card/95 text-foreground hover:bg-card border border-border/80"
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Normal Map
          </button>
          <button
            onClick={() => setLayer("satellite")}
            aria-pressed={layer === "satellite"}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-md backdrop-blur transition-colors ${
              layer === "satellite"
                ? "bg-forest text-white"
                : "bg-card/95 text-foreground hover:bg-card border border-border/80"
            }`}
          >
            <Satellite className="h-3.5 w-3.5" />
            Satellite View
          </button>
        </div>

        {/* Bottom Map Legend */}
        <div className="absolute bottom-3.5 left-3.5 z-[1000] rounded-2xl bg-card/95 p-3 text-[11px] shadow-lg backdrop-blur border border-border/80 space-y-1">
          <p className="font-extrabold text-foreground pb-0.5">
            {isFarmer ? "Farmer Logistics Map" : "Buyer Sourcing Map"}
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-3 w-3 rounded-full bg-[#10B981] border border-white" />
            <span>
              {isFarmer
                ? `🌾 My Farm Waste Listings (${farmerOwnListings.length})`
                : `🌾 Matched Farmer Waste Suppliers`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-3 w-3 rounded-full bg-[#2563EB] border border-white" />
            <span>
              {isFarmer
                ? `🏢 Matched Industrial Buyers`
                : `🏢 My Purchase Demands (${myBuyerDemands.length})`}
            </span>
          </div>
          {geolocation.coords && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="h-3 w-3 rounded-full bg-[#F97316] border border-white" />
              <span>📍 Your Location</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold pt-0.5 border-t border-border/50">
            <Navigation className="h-3 w-3" />
            <span>Select any item to compute direct route & send message</span>
          </div>
        </div>
      </div>
    </div>
  );
}
