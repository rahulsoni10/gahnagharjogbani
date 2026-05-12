"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gem, LayoutDashboard, Package, TrendingUp, ShoppingBag, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/sales", label: "Sales", icon: ShoppingBag },
  { href: "/rates", label: "Rates", icon: TrendingUp },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-amber-950/95 to-stone-900/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-[4.5rem] items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-400/20 p-1.5 rounded-lg">
              <Gem className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-amber-100">GehnaGhar</span>
              <span className="hidden sm:inline text-amber-400/70 text-xs ml-1.5">Inventory</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors",
                  pathname === href || (href !== "/" && pathname.startsWith(href))
                    ? "bg-amber-400/20 text-amber-300"
                    : "text-amber-100/60 hover:text-amber-100 hover:bg-amber-400/10"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-amber-100/70 hover:text-amber-100 hover:bg-amber-400/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden pb-2 gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === href || (href !== "/" && pathname.startsWith(href))
                  ? "bg-amber-400/20 text-amber-300"
                  : "text-amber-100/60 hover:text-amber-100 hover:bg-amber-400/10"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
