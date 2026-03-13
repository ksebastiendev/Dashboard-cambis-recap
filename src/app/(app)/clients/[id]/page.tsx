import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  formatCfa,
  formatDateFull,
  formatDateShort,
  formatNaira,
  formatOperationType,
} from "@/lib/formatters";
import { getClientDetail } from "@/server/services/clientService";

interface ClientTransactionView {
  id: string;
  operationType: "BUY_NAIRA" | "SELL_NAIRA";
  amountCfa: number;
  amountNaira: number;
  exchangeRate: number;
  note: string | null;
  transactionDate: Date;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getClientDetail(id);

  if (!detail) {
    notFound();
  }

  const { client, stats, transactions } = detail;
  const typedTransactions = transactions as ClientTransactionView[];

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.fullName}
        description={`Client créé le ${formatDateFull(client.createdAt)}`}
        icon={UserRound}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Transactions</CardDescription>
            <CardTitle>{stats.transactionCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Volume CFA</CardDescription>
            <CardTitle>{formatCfa(stats.totalVolumeCfa)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Volume Naira</CardDescription>
            <CardTitle>{formatNaira(stats.totalVolumeNaira)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Dernière transaction</CardDescription>
            <CardTitle className="text-base">
              {stats.lastTransactionDate ? formatDateShort(stats.lastTransactionDate) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Nom: <span className="font-medium">{client.fullName}</span></p>
          <p>Surnom: <span className="font-medium">{client.nickname ?? "—"}</span></p>
          <p>Téléphone: <span className="font-medium">{client.phone ?? "—"}</span></p>
          <p>
            Statut: <Badge variant={client.isActive ? "success" : "muted"}>{client.isActive ? "Actif" : "Inactif"}</Badge>
          </p>
          <p className="sm:col-span-2">Note: <span className="font-medium">{client.note ?? "—"}</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>
            Les opérations les plus récentes de ce client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {typedTransactions.length === 0 ? (
            <EmptyState
              title="Aucune transaction"
              description="Ce client n&apos;a pas encore d&apos;opération enregistrée."
            />
          ) : (
            <div className="space-y-3">
              {typedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant={
                        transaction.operationType === "BUY_NAIRA" ? "success" : "secondary"
                      }
                    >
                      {formatOperationType(transaction.operationType)}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatDateFull(transaction.transactionDate)}
                    </p>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                    <p>CFA: <span className="font-medium">{formatCfa(transaction.amountCfa)}</span></p>
                    <p>Naira: <span className="font-medium">{formatNaira(transaction.amountNaira)}</span></p>
                    <p>Taux: <span className="font-medium">{transaction.exchangeRate.toFixed(4)}</span></p>
                    <p>Note: <span className="font-medium">{transaction.note ?? "—"}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
