import type { Metadata } from "next";
import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata: Metadata = {
  title: "Historique",
};

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique"
        description="Toutes les transactions"
        icon={History}
      />

      {/* TODO Phase 5 — TransactionList avec filtres */}
      <p className="text-muted-foreground text-sm">
        L&apos;historique sera implémenté en Phase 5.
      </p>
    </div>
  );
}
