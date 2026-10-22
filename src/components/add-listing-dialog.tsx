import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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

const COUNTIES = ["Nakuru", "Kisumu", "Kakamega", "Kiambu", "Meru", "Machakos", "Uasin Gishu", "Bungoma"];

export function AddListingDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [wasteType, setWasteType] = useState<string>("Maize Cobs");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [county, setCounty] = useState("Nakuru");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const create = useServerFn(createListing);

  async function submit() {
    if (!quantity || !price || !location)
      return toast.error("Fill in quantity, price and location");
    setBusy(true);
    try {
      await create({
        data: {
          waste_type: wasteType,
          quantity_tons: Number(quantity),
          price_per_ton: Number(price),
          location,
          county,
        },
      });
      toast.success("Listing created", { description: "Buyers can now discover your waste." });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setOpen(false);
      setQuantity("");
      setPrice("");
      setLocation("");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Listing</DialogTitle>
          <DialogDescription>
            Describe the agricultural waste you want to sell.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Waste type</label>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Quantity (tons)</label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputMode="decimal"
                placeholder="15"
                className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Price (KSh / ton)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="18000"
                className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Nakuru - Rongai"
              className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">County</label>
            <Select value={county} onValueChange={setCounty}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Creating..." : "Create Listing"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
