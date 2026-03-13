import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de votre activité"
        icon={LayoutDashboard}
        action={
          <Button asChild size="sm">
            <Link href="/transactions/new">
              <Plus className="h-4 w-4" />
              Nouvelle transaction
            </Link>
          </Button>
        }
      />

      {/* TODO Phase 4 — KpiCards, Charts, TopClients */}
      <p className="text-muted-foreground text-sm">
        Le dashboard sera implémenté en Phase 4.
      </p>
    </div>
  );
}
