import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, PhoneCall, MessageCircle, Mail, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Help & Support — Takathamani" },
      { name: "description", content: "Get help with listings, payments and using Takathamani." },
      { property: "og:title", content: "Help & Support — Takathamani" },
      { property: "og:description", content: "Get help with listings, payments and your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

const FAQS = [
  {
    q: "How do I list agricultural waste?",
    a: "Tap Add New Listing on your dashboard (or dial *000# from any basic phone), choose the waste type, enter quantity, location and your expected price per ton, then confirm.",
  },
  {
    q: "When do I get paid?",
    a: "Payment is sent to your mobile money wallet as soon as the buyer confirms delivery. You can track every payment under Transactions.",
  },
  {
    q: "How does Smart Matching work?",
    a: "Our AI compares your waste type, quantity, location, expected price and quality with verified buyers, then ranks the best matches for you.",
  },
  {
    q: "I don't have a smartphone — can I still use Takathamani?",
    a: "Yes. Dial *000# on any basic phone to register, list waste, view earnings and get SMS updates in your language.",
  },
];

function SupportPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Help & Support</h1>
        <p className="text-sm text-muted-foreground">We're here to help you trade with confidence.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search help articles..."
          aria-label="Search help articles"
          className="w-full rounded-full border border-input bg-card py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { Icon: PhoneCall, title: "Call Support", body: "0700 000 000" },
          { Icon: MessageCircle, title: "WhatsApp", body: "Chat with our team" },
          { Icon: Mail, title: "Email", body: "support@takathamani.app" },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
              <c.Icon className="h-5 w-5" />
            </span>
            <p className="mt-2 text-sm font-bold text-foreground">{c.title}</p>
            <p className="text-xs text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="font-bold text-foreground">Frequently Asked Questions</p>
        <div className="mt-3 divide-y divide-border">
          {FAQS.map((f, i) => (
            <div key={f.q} className="py-3">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between text-left text-sm font-semibold text-foreground"
              >
                {f.q}
                <ChevronRight
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    open === i ? "rotate-90" : ""
                  }`}
                />
              </button>
              {open === i && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Need more help? Visit{" "}
        <Link to="/settings" className="font-semibold text-primary hover:underline">
          Settings
        </Link>{" "}
        or dial *000# for USSD support.
      </p>
    </div>
  );
}
