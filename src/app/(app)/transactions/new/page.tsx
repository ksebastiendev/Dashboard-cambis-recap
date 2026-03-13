import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickTransactionForm } from "@/components/transactions/QuickTransactionForm";
import { listClientChoices } from "@/server/services/transactionService";

export const metadata: Metadata = {
  title: "Nouvelle transaction",
};

export default async function NewTransactionPage() {
  const clients = await listClientChoices();

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader
        title="Nouvelle transaction"
        description="Saisie rapide"
        icon={Plus}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enregistrer une transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickTransactionForm clients={clients} />
        </CardContent>
      </Card>
    </div>
  );
}
