import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, UserRound } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getDashboard } from "@/lib/marketplace.functions";
import { roleLabel } from "@/lib/types";

export function Topbar() {
  const getDash = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const profile = data?.profile;
  const role = data?.role ?? "farmer";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-card/95 px-6 py-3 backdrop-blur">
      <SidebarTrigger className="shrink-0" />
      <div className="relative flex-1 max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search for waste, buyers, or locations..."
          aria-label="Search for waste, buyers, or locations"
          className="w-full rounded-full border border-input bg-background py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Link to="/settings" className="hidden items-center gap-2.5 sm:flex">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-primary">
            {(profile?.full_name ?? "?").slice(0, 1)}
          </span>
          <span className="text-left text-xs leading-tight">
            <span className="block font-bold text-foreground">{profile?.full_name ?? "..."}</span>
            <span className="text-muted-foreground">{roleLabel(role)}</span>
          </span>
        </Link>
        <Link
          to="/settings"
          aria-label="Account"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <UserRound className="h-4.5 w-4.5" />
        </Link>
      </div>
    </header>
  );
}
