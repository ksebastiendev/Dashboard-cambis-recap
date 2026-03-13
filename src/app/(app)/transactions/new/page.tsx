import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata: Metadata = {
  title: "Nouvelle transaction",
};

export default function NewTransactionPage() {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader
        title="Nouvelle transaction"
        description="Saisie rapide"
        icon={Plus}
      />

      {/* TODO Phase 3 — QuickTransactionForm */}
      <p className="text-muted-foreground text-sm">
        Le formulaire de saisie sera implémenté en Phase 3.
      </p>
    </div>
  );
}
