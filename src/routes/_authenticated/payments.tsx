import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CheckCircle2, Users, Briefcase } from "lucide-react";
import { getDashboard, getImpact } from "@/lib/marketplace.functions";
import { formatKsh } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments & Transactions — Takathamani" },
      {
        name: "description",
        content: "Safe, fast, transparent mobile-money payments for your agricultural waste sales.",
      },
      { property: "og:title", content: "Payments & Transactions — Takathamani" },
      { property: "og:description", content: "Safe, fast, transparent mobile-money payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaymentsPage,
});

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PaymentsPage() {
  const getDash = useServerFn(getDashboard);
  const getImpactFn = useServerFn(getImpact);
  const dashQ = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const impactQ = useQuery({ queryKey: ["impact"], queryFn: () => getImpactFn() });

  if (dashQ.isLoading || impactQ.isLoading || !dashQ.data) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Loading transactions...</p>;
  }

  const latest = dashQ.data.transactions[0];
  const impact = impactQ.data;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Payments & Transactions</h1>
        <p className="text-sm text-muted-foreground">Safe. Fast. Transparent.</p>
      </div>

      {latest && (
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-forest p-6 text-primary-foreground sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary">
            <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
          </span>
          <div className="flex-1">
            <p className="font-bold">Payment Received!</p>
            <p className="text-3xl font-extrabold">{formatKsh(latest.amount)}</p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              {latest.waste_type} · {latest.tons} Tons
            </p>
            <p className="text-sm text-primary-foreground/80">{latest.counterparty}</p>
            <p className="text-xs text-primary-foreground/60">{fmtDate(latest.paid_at ?? latest.created_at)}</p>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="mb-4 font-bold text-foreground">Recent Transactions</p>
        <div className="space-y-3">
          {dashQ.data.transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                {t.counterparty.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-bold text-foreground">{t.counterparty}</p>
                  {t.status === "completed" && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.waste_type} · {t.tons} Tons ·{" "}
                  {new Date(t.paid_at ?? t.created_at).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="text-sm font-extrabold text-primary">+{formatKsh(t.amount)}</p>
            </div>
          ))}
          {dashQ.data.transactions.length === 0 && (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          )}
        </div>
      </div>

      {impact && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{impact.farmers_benefited}</p>
              <p className="text-xs text-muted-foreground">Farmers Benefited</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{impact.jobs_created}</p>
              <p className="text-xs text-muted-foreground">Jobs Created</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
