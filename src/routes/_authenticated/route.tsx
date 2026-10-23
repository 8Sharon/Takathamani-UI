import { useEffect } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { supabase } from "@/integrations/supabase/client";
import { getDashboard } from "@/lib/marketplace.functions";
import { useRoleMessages } from "@/lib/messages-store";
import { saveStoredFarmerAccount } from "@/lib/farmer-accounts";

import { PageFooter } from "@/components/page-footer";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/" });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const getDash = useServerFn(getDashboard);
  const { data: dashData } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const role = dashData?.role === "buyer" ? "buyer" : "farmer";
  const { unreadCount } = useRoleMessages(role);

  useEffect(() => {
    if (dashData?.role === "farmer" && dashData.profile) {
      saveStoredFarmerAccount(dashData.profile);
    }
  }, [dashData]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar unread={unreadCount} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar unread={unreadCount} />
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
          <PageFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}

