import type { Metadata } from "next";
import { History } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCfa,
  formatDateFull,
  formatNaira,
  formatOperationType,
  formatTime,
} from "@/lib/formatters";
import {
  listClientChoices,
  listTransactionsWithClient,
} from "@/server/services/transactionService";
import type { OperationType } from "@prisma/client";

export const metadata: Metadata = {
  title: "Historique",
};

function parseDateStart(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDateEnd(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setHours(23, 59, 59, 999);
  return date;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    clientId?: string;
    operationType?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { clientId, operationType, from, to } = await searchParams;
  const clients = await listClientChoices();

  const typeFilter: OperationType | undefined =
    operationType === "BUY_NAIRA" || operationType === "SELL_NAIRA"
      ? operationType
      : undefined;

  const transactions = await listTransactionsWithClient({
    clientId: clientId || undefined,
    operationType: typeFilter,
    from: parseDateStart(from),
    to: parseDateEnd(to),
    limit: 300,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique"
        description="Toutes les transactions"
        icon={History}
      />

      <form className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4" action="/history" method="GET">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="clientId">
            Client
          </label>
          <select
            id="clientId"
            name="clientId"
            defaultValue={clientId ?? ""}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Tous les clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="operationType">
            Type
          </label>
          <select
            id="operationType"
            name="operationType"
            defaultValue={typeFilter ?? ""}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Tous les types</option>
            <option value="BUY_NAIRA">Achat Naira</option>
            <option value="SELL_NAIRA">Vente Naira</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="from">
            Du
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from ?? ""}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="to">
            Au
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to ?? ""}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex gap-2 md:col-span-2 xl:col-span-4 xl:justify-end">
          <Button type="submit" variant="outline">
            Filtrer
          </Button>
          <Button asChild variant="ghost">
            <Link href="/history">Réinitialiser</Link>
          </Button>
        </div>
      </form>

      {transactions.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={History}
              title="Aucune transaction trouvée"
              description="Ajuste les filtres ou enregistre une nouvelle transaction."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{transaction.client.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateFull(transaction.transactionDate)} à {formatTime(transaction.transactionDate)}
                    </p>
                  </div>
                  <Badge variant={transaction.operationType === "BUY_NAIRA" ? "success" : "warning"}>
                    {formatOperationType(transaction.operationType)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  <p>
                    Montant CFA: <span className="font-medium">{formatCfa(transaction.amountCfa)}</span>
                  </p>
                  <p>
                    Montant Naira: <span className="font-medium">{formatNaira(transaction.amountNaira)}</span>
                  </p>
                  <p>
                    Taux: <span className="font-medium">{transaction.exchangeRate.toFixed(4)}</span>
                  </p>
                </div>

                {transaction.note && (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {transaction.note}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
