import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Store, Package, MessageSquare, LayoutGrid } from "lucide-react";

const items = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Listings", url: "/listings", icon: Package },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "More", url: "/settings", icon: LayoutGrid },
];

export function MobileBottomNav({ unread = 0 }: { unread?: number }) {
  const currentPath = useRouterState({ select: (router) => router.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active =
            currentPath === item.url ||
            (item.url === "/marketplace" &&
              (currentPath === "/smart-matching" || currentPath === "/map"));
          return (
            <Link
              key={item.title}
              to={item.url}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {item.title === "Messages" && unread > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-foreground">
                    {unread}
                  </span>
                )}
              </span>
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
