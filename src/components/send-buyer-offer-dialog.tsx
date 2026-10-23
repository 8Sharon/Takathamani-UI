import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Send, Sparkles, MapPin, BadgeCheck, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { BuyerDemand } from "@/lib/types";
import { resolveWasteImage } from "@/lib/waste-images";
import { saveMessage } from "@/lib/messages-store";

interface SendBuyerOfferDialogProps {
  children?: React.ReactNode;
  demand: BuyerDemand;
  farmerName?: string | undefined;
  farmerPhone?: string | undefined;
  onSuccess?: () => void;
}

const QUICK_FARMER_PROMPTS = [
  "I have this exact volume ready for pickup at my farm.",
  "Can you send your transport truck this week for loading?",
  "Our waste is dry, packaged and ready for weighbridge inspection.",
  "Please call me to finalize the pricing and pickup schedule.",
];

export function SendBuyerOfferDialog({
  children,
  demand,
  farmerName = "Farmer",
  farmerPhone = "+254 700 000000",
  onSuccess,
}: SendBuyerOfferDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(farmerName);
  const [phone, setPhone] = useState(farmerPhone);
  const [subject, setSubject] = useState(
    `Supply Offer: ${demand.waste_type} for ${demand.company_name || demand.buyer_name}`
  );
  const [body, setBody] = useState(
    `Hello ${demand.company_name || demand.buyer_name}! I saw your demand for ${demand.quantity_tons} Tons of ${demand.waste_type} in ${demand.county}. I have this material ready at our farm and would like to supply your company.`
  );
  const [sending, setSending] = useState(false);

  const img = demand.image_url || resolveWasteImage(demand.waste_type).url;

  function handleSend() {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!body.trim()) {
      toast.error("Please write a message to the buyer");
      return;
    }

    setSending(true);

    try {
      saveMessage({
        sender: name.trim() + (phone.trim() ? ` (${phone.trim()})` : ""),
        sender_role: "farmer",
        recipient_role: "buyer",
        sender_phone: phone.trim(),
        recipient_id: demand.buyer_id,
        listing_title: `Demand: ${demand.quantity_tons}T of ${demand.waste_type}`,
        listing_details: `Budget KSh ${demand.price_per_ton.toLocaleString("en-KE")}/t · ${demand.location || demand.county}`,
        subject: subject.trim(),
        body: body.trim(),
        read: false,
      });

      toast.success("Offer sent to Buyer!", {
        description: `Your supply offer was sent to ${demand.company_name || demand.buyer_name}. They will receive it in their messages.`,
      });

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error("Could not send offer", { description: String(err) });
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <button
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
            title="Message Buyer"
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Message Buyer</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send Supply Offer to Buyer
          </DialogTitle>
          <DialogDescription>
            Contact this buyer directly to fulfill their demand. Your message will be delivered to
            their account inbox with an option to reply.
          </DialogDescription>
        </DialogHeader>

        {/* Demand preview banner */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-primary/25 bg-primary/5 p-3.5">
          <img
            src={img}
            alt={demand.waste_type}
            className="h-16 w-16 rounded-xl object-cover shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-foreground text-sm truncate">
                {demand.company_name || demand.buyer_name}
              </span>
              <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Wants: <strong className="text-foreground">{demand.quantity_tons} Tons</strong> of {demand.waste_type}
            </p>
            <p className="text-xs font-bold text-primary mt-0.5">
              Offered Budget: KSh {demand.price_per_ton.toLocaleString("en-KE")}/ton
            </p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              {demand.location || demand.county} County
            </p>
          </div>
        </div>

        {/* Inputs form */}
        <div className="space-y-3.5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Your Farmer Name / Farm
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Mwangi"
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7..."
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-muted-foreground">
                Your Offer Message
              </label>
              <span className="text-[10px] text-muted-foreground">Tap prompt below to fill</span>
            </div>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="State your available tonnage, pickup location and price..."
              className="w-full rounded-xl border border-input bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Prompt chips */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Suggested Notes:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FARMER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setBody(prompt)}
                  className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground text-left transition-colors"
                >
                  "{prompt.slice(0, 48)}..."
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={handleSend}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sending ? "Sending..." : "Send Offer"}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
