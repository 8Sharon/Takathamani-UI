import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { getMessages, markMessageRead } from "@/lib/marketplace.functions";
import type { Message } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Takathamani" },
      { name: "description", content: "Buyer offers, payment alerts and platform updates." },
      { property: "og:title", content: "Messages — Takathamani" },
      { property: "og:description", content: "Buyer offers, payment alerts and platform updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MessagesPage,
});

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function MessagesPage() {
  const getMsgs = useServerFn(getMessages);
  const markRead = useServerFn(markMessageRead);
  const { data, isLoading } = useQuery({ queryKey: ["messages"], queryFn: () => getMsgs() });
  const queryClient = useQueryClient();

  async function open(m: Message) {
    if (!m.read) {
      await markRead({ data: { id: m.id } });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  }

  if (isLoading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Loading messages...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground">Buyer offers, payment alerts and updates.</p>
      </div>

      <div className="space-y-3">
        {(data ?? []).map((m) => (
          <details
            key={m.id}
            onToggle={(e) => (e.target as HTMLDetailsElement).open && open(m)}
            className={`group rounded-2xl border bg-card p-4 shadow-sm transition-colors ${
              m.read ? "border-border" : "border-primary/40 bg-secondary/40"
            }`}
          >
            <summary className="flex cursor-pointer list-none items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${m.read ? "font-semibold text-foreground" : "font-extrabold text-foreground"}`}>
                  {m.sender}
                  {!m.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />}
                </p>
                <p className="truncate text-sm text-muted-foreground">{m.subject}</p>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo(m.created_at)}</span>
            </summary>
            <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-foreground">
              {m.body}
            </p>
          </details>
        ))}
        {(data ?? []).length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No messages yet.</p>
        )}
      </div>
    </div>
  );
}
