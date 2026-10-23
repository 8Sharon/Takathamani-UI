import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Store,
  ArrowLeftRight,
  Leaf,
  MessageSquare,
  HelpCircle,
  Settings,
  LogOut,
  Info,
  MapPin,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LeafLogo } from "./leaf-logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "View Map", url: "/map", icon: MapPin },
  { title: "My Listings", url: "/listings", icon: Package },
  { title: "Transactions", url: "/payments", icon: ArrowLeftRight },
  { title: "Impact Tracker", url: "/impact", icon: Leaf },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "About", url: "/about", icon: Info },
  { title: "Support", url: "/support", icon: HelpCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar({ unread = 0 }: { unread?: number }) {
  const currentPath = useRouterState({ select: (router) => router.location.pathname });
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-1">
          <LeafLogo className="h-10 w-10 shrink-0" />
          <span
            className="text-lg font-extrabold leading-none text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden"
            data-sidebar="link"
          >
            Takathamani
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4.5 w-4.5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.title === "Messages" && unread > 0 && (
                    <SidebarMenuBadge className="bg-red-600 text-white font-extrabold text-[11px] px-2 py-0.5 shadow-sm animate-pulse">
                      {unread}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Logout button pinned to the bottom of the sidebar */}
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
