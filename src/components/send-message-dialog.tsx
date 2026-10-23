import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { MessageSquare, Send, Sparkles, MapPin, CheckCircle2, User, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Listing } from "@/lib/types";
import { listingImage } from "@/lib/waste-images";
import { saveMessage } from "@/lib/messages-store";

interface SendMessageDialogProps {
  children?: React.ReactNode;
  listing: Listing;
  senderName?: string | undefined;
  senderPhone?: string | undefined;
  senderRole?: "buyer" | "farmer" | undefined;
  recipientRole?: "buyer" | "farmer" | undefined;
  recipientName?: string | undefined;
  onSuccess?: () => void;
}

const BUYER_PROMPTS = [
  "I am interested in procuring this full batch. Is it ready for pickup?",
  "Can we arrange a sample or on-site inspection this week?",
  "We can provide our own transport trucks. What is your best bulk price?",
  "Please call me to coordinate weighbridge testing and payment.",
];

const FARMER_PROMPTS = [
  "I have this full batch ready for immediate pickup and weighbridge inspection.",
  "Can you arrange transport trucks to our farm or collection hub this week?",
  "What moisture specifications and payment terms do you require?",
  "Please call me on my phone to coordinate loading and delivery schedule.",
];

export function SendMessageDialog({
  children,
  listing,
  senderName = "User",
  senderPhone = "+254 700 000000",
  senderRole,
  recipientRole,
  recipientName,
  onSuccess,
}: SendMessageDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const effectiveSenderRole = senderRole || "buyer";
  const effectiveRecipientRole =
    recipientRole || (effectiveSenderRole === "farmer" ? "buyer" : "farmer");
  const recipientLabel = effectiveRecipientRole === "buyer" ? "Buyer" : "Farmer";
  const effectiveRecipientName =
    recipientName ||
    (effectiveRecipientRole === "buyer"
      ? "Industrial Buyer"
      : listing.farmer_name || "Verified Farmer");

  const defaultSubject = useMemo(() => {
    return effectiveSenderRole === "farmer"
      ? `Supply Offer: ${listing.quantity_tons}T ${listing.waste_type} (${listing.location})`
      : `Enquiry: ${listing.quantity_tons}T ${listing.waste_type} (${listing.location})`;
  }, [effectiveSenderRole, listing]);

  const defaultBody = useMemo(() => {
    return effectiveSenderRole === "farmer"
      ? `Hello! I have ${listing.quantity_tons} Tons of ${listing.waste_type} listed at KSh ${listing.price_per_ton.toLocaleString("en-KE")}/ton in ${listing.location}, ${listing.county} ready for collection or supply to your facility. Feel free to coordinate transport and moisture inspection.`
      : `Hello! I am interested in sourcing your ${listing.quantity_tons} Tons of ${listing.waste_type} listed at KSh ${listing.price_per_ton.toLocaleString("en-KE")}/ton in ${listing.location}, ${listing.county}. Could you let me know if it is ready for pickup?`;
  }, [effectiveSenderRole, listing]);

  const [name, setName] = useState(senderName);
  const [phone, setPhone] = useState(senderPhone);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setName(senderName);
      setPhone(senderPhone);
      setSubject(defaultSubject);
      setBody(defaultBody);
    }
  }, [open, listing.id, senderName, senderPhone, defaultSubject, defaultBody]);

  const activePrompts = effectiveSenderRole === "farmer" ? FARMER_PROMPTS : BUYER_PROMPTS;

  function handleSend() {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!body.trim()) {
      toast.error(`Please write a message to the ${recipientLabel.toLowerCase()}`);
      return;
    }

    setSending(true);

    try {
      saveMessage({
        sender: name.trim() + (phone.trim() ? ` (${phone.trim()})` : ""),
        sender_role: effectiveSenderRole,
        recipient_role: effectiveRecipientRole,
        sender_phone: phone.trim(),
        recipient_id: listing.farmer_id,
        listing_id: listing.id,
        listing_title: `${listing.quantity_tons}T of ${listing.waste_type}`,
        listing_details: `KSh ${listing.price_per_ton.toLocaleString("en-KE")}/t · ${listing.location}, ${listing.county}`,
        subject: subject.trim(),
        body: body.trim(),
        read: false,
      });

      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success(`Message sent to ${recipientLabel}!`, {
        description: `Your message for ${listing.waste_type} was delivered to the ${recipientLabel.toLowerCase()}'s account and is visible in their Messages inbox.`,
      });

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error("Could not send message", { description: String(err) });
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
            title={`Message ${recipientLabel}`}
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Message {recipientLabel}</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageSquare className="h-5 w-5 text-primary" />
            Message {recipientLabel} About Listing
          </DialogTitle>
          <DialogDescription>
            Send a direct message or supply offer to the {recipientLabel.toLowerCase()}. Your message
            will appear immediately in their inbox with an option to reply.
          </DialogDescription>
        </DialogHeader>

        {/* Listing preview banner */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-primary/25 bg-primary/5 p-3.5">
          <img
            src={listingImage(listing)}
            alt={listing.waste_type}
            className="h-16 w-16 rounded-xl object-cover shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-foreground text-sm truncate">
                {listing.waste_type}
              </span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                {listing.quantity_tons} Tons Available
              </span>
            </div>

            <p className="text-xs font-bold text-primary mt-0.5">
              KSh {listing.price_per_ton.toLocaleString("en-KE")} / ton
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {listing.location}, {listing.county}
              </span>
              <span className="rounded-md bg-secondary/80 px-2 py-0.5 font-bold text-foreground flex items-center gap-1 border border-border/60">
                {effectiveRecipientRole === "buyer" ? (
                  <Building2 className="h-3 w-3 text-blue-500" />
                ) : (
                  <User className="h-3 w-3 text-emerald-500" />
                )}
                To: {effectiveRecipientName}
              </span>
            </div>
          </div>
        </div>

        {/* Inputs form */}
        <div className="space-y-3.5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Your Name / Company
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name or business name"
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Your Contact Phone
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
                Your Message / Offer to {recipientLabel}
              </label>
              <span className="text-[10px] text-muted-foreground">Prompt Suggestions below</span>
            </div>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Write your message to the ${recipientLabel.toLowerCase()}...`}
              className="w-full rounded-xl border border-input bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Prompt chips */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Tap to Insert Quick Note:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activePrompts.map((prompt) => (
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
              className="flex items-center gap-2 rounded-xl bg-forest px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-forest-deep transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sending ? "Sending..." : `Send Message to ${recipientLabel}`}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
