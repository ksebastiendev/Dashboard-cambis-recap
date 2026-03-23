"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Users,
  History,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Nouveau",
    href: "/transactions/new",
    icon: Plus,
    highlight: true,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Historique",
    href: "/history",
    icon: History,
  },
  {
    label: "API",
    href: "/api/docs",
    icon: BookOpen,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card">
      {/* Safe area padding pour iOS */}
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
                {/* Bouton surélevé CTA */}
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </span>
                <span className="text-[10px] font-medium text-primary mt-1">
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
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className={cn("text-[10px] font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
