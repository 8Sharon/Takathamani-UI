import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Sparkles, Image as ImageIcon, CheckCircle2, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WASTE_TYPES, type Listing } from "@/lib/types";
import { COUNTY_NAMES } from "@/lib/kenya-counties";
import { resolveWasteImage } from "@/lib/waste-images";
import { createBuyerDemand } from "@/lib/buyer-demands";

const COUNTIES = COUNTY_NAMES;

const QUICK_OTHER_SUGGESTIONS = [
  "Banana Stems Biomass",
  "Sawdust / Wood Shavings",
  "Cassava Peels",
  "Mango Processing Waste",
  "Pineapple Crowns",
  "Potato Vines",
  "Avocado Seed Residue",
];

interface AddBuyerDemandDialogProps {
  children?: React.ReactNode;
  availableFarmerListings?: Listing[] | undefined;
  defaultListing?: Listing | undefined;
  buyerName?: string | undefined;
  companyName?: string | undefined;
  phone?: string | undefined;
  county?: string | undefined;
  onSuccess?: (() => void) | undefined;
}

export function AddBuyerDemandDialog({
  children,
  availableFarmerListings = [],
  defaultListing,
  buyerName = "Buyer",
  companyName = "BioEnergy Enterprise",
  phone = "+254 700 000000",
  county: defaultCounty = "Nakuru",
  onSuccess,
}: AddBuyerDemandDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"custom" | "from_farmer">(
    defaultListing ? "from_farmer" : "custom"
  );
  const [selectedFarmerListingId, setSelectedFarmerListingId] = useState<string>(
    defaultListing?.id ?? ""
  );

  const [wasteType, setWasteType] = useState<string>(
    defaultListing?.waste_type ?? "Maize Cobs"
  );
  const [otherLabel, setOtherLabel] = useState("");
  const [quantity, setQuantity] = useState(
    defaultListing ? String(defaultListing.quantity_tons) : "20"
  );
  const [price, setPrice] = useState(
    defaultListing ? String(defaultListing.price_per_ton) : "18000"
  );
  const [county, setCounty] = useState(defaultCounty);
  const [location, setLocation] = useState(defaultListing?.location ?? "Industrial Area");
  const [notes, setNotes] = useState("");
  const [buyerCompany, setBuyerCompany] = useState(companyName);

  const isOther = mode === "custom" && wasteType === "Other";
  const effectiveType = isOther && otherLabel.trim() ? otherLabel.trim() : wasteType;

  // Resolve live image preview
  const resolvedImage = useMemo(() => {
    return resolveWasteImage(effectiveType);
  }, [effectiveType]);

  // When user selects an existing farmer listing from the dropdown
  function handleFarmerListingSelect(listingId: string) {
    setSelectedFarmerListingId(listingId);
    const matched = availableFarmerListings.find((l) => l.id === listingId);
    if (matched) {
      setWasteType(matched.waste_type);
      setQuantity(String(matched.quantity_tons));
      setPrice(String(matched.price_per_ton));
      setCounty(matched.county);
      setLocation(matched.location);
    }
  }

  function handleSubmit() {
    if (!quantity || !price || !county) {
      toast.error("Please fill in quantity, budget price and county");
      return;
    }
    if (isOther && !otherLabel.trim()) {
      toast.error("Please specify your desired waste type");
      return;
    }

    createBuyerDemand({
      buyer_id: "current-buyer",
      buyer_name: buyerName,
      company_name: buyerCompany.trim() || companyName,
      phone,
      waste_type: effectiveType,
      quantity_tons: Number(quantity),
      price_per_ton: Number(price),
      county,
      location: location.trim() || `${county} Region`,
      notes: notes.trim(),
      from_farmer_listing_id: mode === "from_farmer" ? selectedFarmerListingId : undefined,
      image_url: resolvedImage.url,
      status: "active",
    });

    toast.success("Waste Demand Listed!", {
      description: `Farmers can now see your request for ${quantity}T of ${effectiveType} on their account page.`,
    });

    setOpen(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <button className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-forest-deep">
            <ShoppingBag className="h-4 w-4" />
            <span>List Waste I Want to Buy</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Post Waste Purchase Demand
          </DialogTitle>
          <DialogDescription>
            List the agricultural waste you need. Your request will be reflected on farmers' account
            pages so they can supply you directly.
          </DialogDescription>
        </DialogHeader>

        {/* Source selector: pick from existing farmer listings OR create custom request */}
        {availableFarmerListings.length > 0 && (
          <div className="flex rounded-xl bg-muted p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex-1 rounded-lg py-2 transition-colors ${
                mode === "custom"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Custom Waste Request
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("from_farmer");
                if (!selectedFarmerListingId && availableFarmerListings[0]) {
                  handleFarmerListingSelect(availableFarmerListings[0].id);
                }
              }}
              className={`flex-1 rounded-lg py-2 transition-colors ${
                mode === "from_farmer"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              From Farmers' Listings ({availableFarmerListings.length} available)
            </button>
          </div>
        )}

        <div className="space-y-4 pt-1">
          {mode === "from_farmer" ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Select from Farmers' Available Listings
              </label>
              <Select
                value={selectedFarmerListingId}
                onValueChange={(id) => handleFarmerListingSelect(id)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a farmer's listing..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableFarmerListings.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.waste_type} — {l.quantity_tons}T @ KSh {l.price_per_ton.toLocaleString()}/ton ({l.location}, {l.county})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Waste Material Needed
              </label>
              <Select value={wasteType} onValueChange={setWasteType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WASTE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* "Other" input with Live Dynamic Image Display */}
          {isOther && (
            <div className="space-y-2.5 rounded-2xl border border-primary/25 bg-primary/5 p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Describe the waste you want to buy
                </label>
                <span className="text-[11px] font-semibold text-primary">Live photo preview</span>
              </div>
              <input
                value={otherLabel}
                onChange={(e) => setOtherLabel(e.target.value)}
                placeholder="e.g. Banana Stems, Cassava Peels, Sawdust, Mango Peels…"
                aria-label="Describe waste"
                className="w-full rounded-xl border border-input bg-card py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground">Quick pick:</span>
                {QUICK_OTHER_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setOtherLabel(s)}
                    className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Image Preview */}
          <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                Waste Image Preview
              </span>
              <span className="text-[11px] text-primary font-bold">
                {isOther && !otherLabel.trim() ? "Type above to update" : "Auto-matched"}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-muted">
              <img
                src={resolvedImage.url}
                alt={resolvedImage.label}
                className="h-32 w-full object-cover transition-all duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 text-white">
                <p className="text-xs font-bold leading-tight">{resolvedImage.label}</p>
                <p className="text-[10px] text-white/80">
                  Visible to farmers on their dashboard & marketplace.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Quantity Needed (Tons)
              </label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputMode="decimal"
                placeholder="25"
                className="w-full rounded-xl border border-input bg-card py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Budget / Offer (KSh/ton)
              </label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="18000"
                className="w-full rounded-xl border border-input bg-card py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Company / Buyer Name
              </label>
              <input
                value={buyerCompany}
                onChange={(e) => setBuyerCompany(e.target.value)}
                placeholder="e.g. EcoBriquettes Ltd"
                className="w-full rounded-xl border border-input bg-card py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Delivery County
              </label>
              <Select value={county} onValueChange={setCounty}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {COUNTIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Delivery Location / Factory Details
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Rongai Industrial Park or Farm Pickup"
              className="w-full rounded-xl border border-input bg-card py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Special Notes for Farmers (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Moisture content < 15% preferred; we arrange transport for large volumes."
              className="w-full rounded-xl border border-input bg-card py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-forest py-3 text-sm font-bold text-white transition-colors hover:bg-forest-deep flex items-center justify-center gap-2 shadow-lg shadow-forest/20"
          >
            <CheckCircle2 className="h-4 w-4" />
            Post Waste Demand to Farmers
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
