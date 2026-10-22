import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Leaf, TreePine, Users, Briefcase } from "lucide-react";
import { getImpact } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/impact")({
  head: () => ({
    meta: [
      { title: "Environmental Impact — Takathamani" },
      {
        name: "description",
        content: "See the real impact of your waste recovery: tons recovered, CO₂ avoided, farmers benefited and jobs created.",
      },
      { property: "og:title", content: "Environmental Impact — Takathamani" },
      { property: "og:description", content: "Waste recovered, CO₂ avoided, farmers benefited, jobs created." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImpactPage,
});

const BAR_COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-5"];

function ImpactPage() {
  const getImpactFn = useServerFn(getImpact);
  const { data, isLoading } = useQuery({ queryKey: ["impact"], queryFn: () => getImpactFn() });

  if (isLoading || !data) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Loading impact...</p>;
  }

  const breakdown = Object.entries(data.breakdown ?? {});

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Environmental Impact</h1>
        <p className="text-sm text-muted-foreground">See the real impact of your waste recovery.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Leaf className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold text-muted-foreground">Total Waste Recovered</p>
          <p className="text-4xl font-extrabold text-foreground">{Number(data.total_recovered_tons).toFixed(1)} Tons</p>
          <p className="mt-1 text-xs font-semibold text-primary">+12% from last month</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
            <TreePine className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold text-muted-foreground">Estimated CO₂e Avoided</p>
          <p className="text-4xl font-extrabold text-foreground">{Number(data.co2_avoided_tons).toFixed(1)} Tons</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Equivalent to <span className="font-semibold text-primary">{data.trees_equivalent.toLocaleString("en-KE")} trees/year</span>
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="font-bold text-foreground">Impact by Material</p>
        <div className="mt-4 space-y-4">
          {breakdown.map(([name, pct], i) => (
            <div key={name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{name}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-extrabold text-foreground">{data.farmers_benefited}</p>
            <p className="text-xs text-muted-foreground">Farmers Benefited</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-extrabold text-foreground">{data.jobs_created}</p>
            <p className="text-xs text-muted-foreground">Jobs Created</p>
          </div>
        </div>
      </div>
    </div>
  );
}
