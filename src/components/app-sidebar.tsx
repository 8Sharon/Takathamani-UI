import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Store,
  ArrowLeftRight,
  Leaf,
  MessageSquare,
  HelpCircle,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LeafLogo } from "./leaf-logo";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Listings", url: "/listings", icon: Package },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Transactions", url: "/payments", icon: ArrowLeftRight },
  { title: "Impact Tracker", url: "/impact", icon: Leaf },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Support", url: "/support", icon: HelpCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar({ unread = 0 }: { unread?: number }) {
  const currentPath = useRouterState({ select: (router) => router.location.pathname });

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
                    <SidebarMenuBadge className="bg-primary text-primary-foreground">
                      {unread}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
