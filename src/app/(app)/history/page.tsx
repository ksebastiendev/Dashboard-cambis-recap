import type { Metadata } from "next";
import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { HistoryV2Client } from "@/components/history/HistoryV2Client";

export const metadata: Metadata = { title: "Historique — Chapkey Recap" };

export default function HistoryPage() {
  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <PageHeader
        title="Historique"
        description="Toutes les opérations V2"
        icon={History}
      />
      <HistoryV2Client />
    </div>
  );
}
