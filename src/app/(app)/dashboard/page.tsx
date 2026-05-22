import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardV2Client } from "@/components/dashboard/DashboardV2Client";

export const metadata: Metadata = { title: "Dashboard — Chapkey Recap" };

export default function DashboardPage() {
  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de votre activité"
        icon={LayoutDashboard}
      />
      <DashboardV2Client />
    </div>
  );
}
