import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { getDashboard } from "@/lib/marketplace.functions";

/** The signed-in frame: sidebar + topbar + content, used by every app route. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const getDash = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar unread={data?.unreadMessages ?? 0} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-6 pb-24 lg:p-8 lg:pb-8">{children}</main>
        </div>
      </div>
      <MobileBottomNav unread={data?.unreadMessages ?? 0} />
    </SidebarProvider>
  );
}
