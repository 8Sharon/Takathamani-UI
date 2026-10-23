import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Reply,
  CheckCircle2,
  Package,
  ArrowRight,
  Clock,
  Sparkles,
  Phone,
  Store,
} from "lucide-react";
import { getMessages, markMessageRead, getDashboard } from "@/lib/marketplace.functions";
import type { Message } from "@/lib/types";
import {
  useRoleMessages,
  saveMessage,
  markStoredMessageRead,
  markAllRoleMessagesRead,
} from "@/lib/messages-store";
import { useActiveFarmerAccount, saveStoredFarmerAccount } from "@/lib/farmer-accounts";
import { timeAgo } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Takathamani" },
      { name: "description", content: "Direct communications between buyers and farmers regarding agricultural waste listings." },
      { property: "og:title", content: "Messages — Takathamani" },
      { property: "og:description", content: "Direct communications between buyers and farmers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MessagesPage,
});

export function MessagesPage() {
  const getMsgs = useServerFn(getMessages);
  const markRead = useServerFn(markMessageRead);
  const getDash = useServerFn(getDashboard);

  const { data: serverMsgs, isLoading: msgsLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => getMsgs(),
  });
  const { data: dashData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDash(),
  });

  const queryClient = useQueryClient();
  const currentRole = (dashData?.role === "buyer" ? "buyer" : "farmer") as "buyer" | "farmer";
  const { messages: localMsgs } = useRoleMessages(currentRole);

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const activeFarmer = useActiveFarmerAccount();

  useEffect(() => {
    if (dashData?.role === "farmer" && dashData?.profile) {
      saveStoredFarmerAccount(dashData.profile);
    }
  }, [dashData]);

  useEffect(() => {
    // Automatically mark all messages as read for this role so the red indicator disappears
    markAllRoleMessagesRead(currentRole);
    queryClient.invalidateQueries({ queryKey: ["messages"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [currentRole, queryClient]);

  // Combine server messages and local messages without duplicate IDs
  const combinedMessages: Message[] = (() => {
    const map = new Map<string, Message>();
    for (const m of localMsgs) {
      map.set(m.id, m);
    }
    for (const m of serverMsgs ?? []) {
      if ((!m.recipient_role || m.recipient_role === currentRole) && !map.has(m.id)) {
        map.set(m.id, m);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  })();

  async function handleOpen(m: Message) {
    if (!m.read) {
      markStoredMessageRead(m.id);
      try {
        if (/^[0-9a-f-]{36}$/i.test(m.id)) {
          await markRead({ data: { id: m.id } });
        }
      } catch {
        // ignore if local id
      }
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  }

  function handleSendReply(m: Message) {
    if (!replyText.trim()) {
      toast.error("Please enter your reply");
      return;
    }

    setIsReplying(true);
    try {
      const myName = dashData?.profile.full_name || (currentRole === "buyer" ? "Buyer" : "Farmer");
      const myPhone = dashData?.profile.phone || "";

      saveMessage({
        sender: myName + (myPhone ? ` (${myPhone})` : ""),
        sender_role: currentRole,
        recipient_role: currentRole === "buyer" ? "farmer" : "buyer",
        sender_phone: myPhone,
        recipient_id: m.sender_id,
        listing_id: m.listing_id,
        listing_title: m.listing_title,
        listing_details: m.listing_details,
        subject: m.subject.startsWith("Re:") ? m.subject : `Re: ${m.subject}`,
        body: replyText.trim(),
        reply_to_id: m.id,
        read: false,
      });

      toast.success("Reply sent successfully!", {
        description: `Your reply was sent to ${m.sender}.`,
      });

      setReplyText("");
      setActiveReplyId(null);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error("Could not send reply", { description: String(err) });
    } finally {
      setIsReplying(false);
    }
  }

  if (msgsLoading && !dashData) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Loading inbox...</p>;
  }

  const farmerQuickReplies = [
    "Yes, this agricultural waste is available and ready for loading.",
    "Please call me on my phone number to coordinate pickup schedule.",
    "We can accommodate your transport truck this week.",
  ];

  const buyerQuickReplies = [
    "Thank you! Could you confirm the exact farm or depot address for loading?",
    "We will arrange transport trucks for pickup as discussed.",
    "Can you share a weighbridge ticket or moisture inspection date?",
  ];

  const quickReplies = currentRole === "farmer" ? farmerQuickReplies : buyerQuickReplies;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Messages & Inquiries
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentRole === "buyer"
              ? "Communicate directly with farmers about waste availability, pickup logistics and pricing."
              : "Inquiries, bulk offers and pickup coordination from verified industrial buyers."}
          </p>
        </div>

        <Link
          to="/marketplace"
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-border bg-secondary/80 px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
        >
          <Store className="h-4 w-4 text-primary" />
          <span>Go to Marketplace</span>
        </Link>
      </div>

      <div className="space-y-3.5">
        {combinedMessages.map((m) => {
          const isReplyOpen = activeReplyId === m.id;
          const isFarmerSender = m.sender_role === "farmer";
          const displaySender =
            isFarmerSender && activeFarmer?.full_name
              ? `${activeFarmer.full_name}${activeFarmer.phone ? ` (${activeFarmer.phone})` : ""}`
              : m.sender;
          const displayPhone =
            isFarmerSender && activeFarmer?.phone ? activeFarmer.phone : m.sender_phone;

          return (
            <details
              key={m.id}
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) {
                  handleOpen(m);
                }
              }}
              className={`group rounded-2xl border bg-card p-4 shadow-xs transition-all ${
                m.read ? "border-border hover:border-primary/30" : "border-primary/50 bg-primary/[0.03] ring-1 ring-primary/20"
              }`}
            >
              <summary className="flex cursor-pointer list-none items-start sm:items-center gap-3.5 select-none">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black text-sm shadow-xs ${
                  m.read ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                }`}>
                  {displaySender.charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`truncate text-sm ${m.read ? "font-semibold text-foreground" : "font-extrabold text-foreground"}`}>
                      {displaySender}
                    </p>
                    {!m.read && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary">
                        New Message
                      </span>
                    )}
                    {m.sender_role && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {m.sender_role === "buyer" ? "🏢 Buyer" : "🌾 Farmer"}
                      </span>
                    )}
                  </div>

                  <p className="truncate text-xs sm:text-sm text-foreground/80 font-medium mt-0.5">
                    {m.subject}
                  </p>

                  {m.listing_title && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-forest">
                      <Package className="h-3 w-3 shrink-0" />
                      <span className="truncate">Listing: {m.listing_title}</span>
                      {m.listing_details && (
                        <span className="text-muted-foreground font-normal"> · {m.listing_details}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(m.created_at)}</span>
                </div>
              </summary>

              {/* Message Body & Actions */}
              <div className="mt-3.5 border-t border-border pt-3.5">
                <div className="rounded-xl bg-secondary/40 p-3.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {m.body}
                </div>

                {displayPhone && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span>Contact Phone: <strong className="text-foreground">{displayPhone}</strong></span>
                  </div>
                )}

                {/* Reply Section */}
                <div className="mt-4 pt-3 border-t border-border/70">
                  {!isReplyOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyId(m.id);
                        setReplyText("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary/15 border border-primary/30 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      <span>Reply to {isFarmerSender && activeFarmer?.full_name ? activeFarmer.full_name.split(" ")[0] : displaySender.split(" ")[0]}</span>
                    </button>
                  ) : (
                    <div className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Reply className="h-3.5 w-3.5 text-primary" />
                          Replying to {displaySender}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveReplyId(null)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Write your response to ${displaySender}...`}
                        className="w-full rounded-xl border border-input bg-secondary/30 p-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-ring"
                      />

                      {/* Quick suggestions */}
                      <div className="flex flex-wrap gap-1.5">
                        {quickReplies.map((qr) => (
                          <button
                            key={qr}
                            type="button"
                            onClick={() => setReplyText(qr)}
                            className="rounded-lg border border-border bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground text-left transition-colors"
                          >
                            "{qr.slice(0, 38)}..."
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={isReplying}
                          onClick={() => handleSendReply(m)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-forest-deep transition-all disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>{isReplying ? "Sending..." : "Send Reply"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </details>
          );
        })}

        {combinedMessages.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
            <Mail className="mx-auto h-9 w-9 text-muted-foreground/50 mb-3" />
            <p className="font-bold text-foreground">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {currentRole === "buyer"
                ? "When you message farmers from the Marketplace about crop residues, their replies will appear here."
                : "When buyers send you inquiries or offers regarding your agricultural waste listings, they will show up here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
