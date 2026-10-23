import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
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
import { createListing } from "@/lib/marketplace.functions";
import { WASTE_TYPES } from "@/lib/types";
import { COUNTY_NAMES } from "@/lib/kenya-counties";
import { resolveWasteImage } from "@/lib/waste-images";
import { getStoredFarmerAccount, associateListingWithFarmer } from "@/lib/farmer-accounts";

const COUNTIES = COUNTY_NAMES;

const QUICK_SUGGESTIONS = [
  "Banana Stems",
  "Sawdust",
  "Cassava Peels",
  "Mango Peels",
  "Pineapple Crowns",
  "Potato Vines",
  "Tea Prunings",
  "Avocado Seeds",
];

export function AddListingDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [wasteType, setWasteType] = useState<string>("Maize Cobs");
  const [otherLabel, setOtherLabel] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [county, setCounty] = useState("Nakuru");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const create = useServerFn(createListing);

  const isOther = wasteType === "Other";
  const effectiveType = isOther && otherLabel.trim() ? otherLabel.trim() : wasteType;

  // Dynamically resolve image preview as user types or selects
  const resolvedImage = useMemo(() => {
    return resolveWasteImage(isOther ? otherLabel : wasteType);
  }, [isOther, otherLabel, wasteType]);

  async function submit() {
    if (!quantity || !price || !location) {
      toast.error("Fill in quantity, price and location");
      return;
    }
    if (isOther && !otherLabel.trim()) {
      toast.error('Please describe your waste type in the "Other" field');
      return;
    }
    setBusy(true);

    try {
      // Use the verified, dynamically resolved photo URL for this waste
      const imageUrl = resolvedImage.url;

      const created = await create({
        data: {
          waste_type: effectiveType,
          quantity_tons: Number(quantity),
          price_per_ton: Number(price),
          location,
          county,
          image_url: imageUrl,
        },
      });

      if (created?.id) {
        const farmer = getStoredFarmerAccount();
        if (farmer?.full_name) {
          associateListingWithFarmer(created.id, {
            full_name: farmer.full_name,
            phone: farmer.phone,
            county,
          });
        }
      }
      toast.success("Listing created successfully!", {
        description: `Buyers can now discover your ${effectiveType} listing with verified photos.`,
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["all-listings"] });
      setOpen(false);
      setQuantity("");
      setPrice("");
      setLocation("");
      setOtherLabel("");
    } catch (err) {
      toast.error("Could not create listing", { description: String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-left transition-colors hover:bg-secondary">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="h-4.5 w-4.5" />
            </span>
            <span className="text-sm font-semibold text-foreground">Add New Listing</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Waste Listing</DialogTitle>
          <DialogDescription>
            Describe the agricultural waste you want to sell to verified buyers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Waste Type</label>
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

          {/* "Other" input with Live Dynamic Image Display */}
          {isOther && (
            <div className="space-y-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  What agricultural waste do you have?
                </label>
                <span className="text-[11px] font-medium text-primary">Live photo preview</span>
              </div>
              <input
                value={otherLabel}
                onChange={(e) => setOtherLabel(e.target.value)}
                placeholder="e.g. Banana Stems, Cassava Peels, Sawdust…"
                aria-label="Other waste type description"
                className="w-full rounded-xl border border-input bg-card py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />

              {/* Suggestions quick chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground">Quick pick:</span>
                {QUICK_SUGGESTIONS.map((s) => (
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

          {/* Live Image Preview Card */}
          <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                Display Photo Preview
              </span>
              <span className="text-[11px] text-primary font-bold">
                {isOther && !otherLabel.trim() ? "Type above to update" : "Auto-matched"}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-muted">
              <img
                src={resolvedImage.url}
                alt={resolvedImage.label}
                className="h-36 w-full object-cover transition-all duration-300 hover:scale-105"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.currentTarget as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 text-white">
                <p className="text-xs font-bold leading-tight">{resolvedImage.label}</p>
                <p className="text-[10px] text-white/80">
                  This photo will be displayed to buyers on the marketplace and map.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Quantity (tons)</label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputMode="decimal"
                placeholder="15"
                className="w-full rounded-xl border border-input bg-card py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Price (KSh / ton)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="18000"
                className="w-full rounded-xl border border-input bg-card py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Location Details</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Rongai Ward, Solai Road"
              className="w-full rounded-xl border border-input bg-card py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">County</label>
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

          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-primary/20"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Creating Listing…" : `Post ${effectiveType} Listing`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
