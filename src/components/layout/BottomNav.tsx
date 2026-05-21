"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Plus,
  Users,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Opérations",
    href: "/operations",
    icon: Plus,
    highlight: true,
  },
  {
    label: "Historique",
    href: "/history",
    icon: History,
  },
];

function useTodayCount() {
  const { data } = useQuery<{ count: number }>({
    queryKey: ["ops-count-today"],
    queryFn: () => fetch("/api/operations/count").then((r) => r.json()),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  return data?.count ?? 0;
}

export function BottomNav() {
  const pathname = usePathname();
  const todayCount = useTodayCount();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 px-4 py-2 -mt-5"
              >
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                  {todayCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white shadow">
                      {todayCount > 99 ? "99+" : todayCount}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium mt-1",
                    isActive ? "text-orange-600" : "text-zinc-400"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-4 py-3 min-w-15",
                isActive ? "text-orange-600" : "text-zinc-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
