"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCfa,
  formatDateFull,
  formatNaira,
  formatOperationType,
  formatTime,
} from "@/lib/formatters";
import type { OperationType } from "@prisma/client";
import { History } from "lucide-react";

interface HistoryFilters {
  clientId?: string;
  operationType?: OperationType;
  from?: string;
  to?: string;
}

interface TransactionRow {
  id: string;
  operationType: OperationType;
  amountCfa: number;
  amountNaira: number;
  exchangeRate: number;
  note: string | null;
  transactionDate: string;
  client: {
    id: string;
    fullName: string;
    nickname: string | null;
    phone?: string | null;
  };
}

interface TransactionsPage {
  data: TransactionRow[];
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

interface HistoryTransactionsListProps {
  filters: HistoryFilters;
}

interface UpdateTransactionPayload {
  id: string;
  operationType: OperationType;
  amountCfa: number;
  amountNaira: number;
  exchangeRate: number;
  note: string;
}

function buildQueryString(filters: HistoryFilters, cursor?: string) {
  const params = new URLSearchParams();
  params.set("limit", "20");

  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.operationType) params.set("operationType", filters.operationType);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (cursor) params.set("cursor", cursor);

  return params.toString();
}

async function fetchTransactionsPage(filters: HistoryFilters, cursor?: string): Promise<TransactionsPage> {
  const queryString = buildQueryString(filters, cursor);
  const response = await fetch(`/api/transactions?${queryString}`, {
    method: "GET",
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Impossible de charger l'historique");
  }

  return body as TransactionsPage;
}

async function deleteTransactionById(id: string) {
  const response = await fetch(`/api/transactions/${id}`, {
    method: "DELETE",
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((body as { error?: string }).error ?? "Suppression impossible");
  }
}

async function updateTransaction(payload: UpdateTransactionPayload): Promise<TransactionRow> {
  const response = await fetch(`/api/transactions/${payload.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operationType: payload.operationType,
      amountCfa: payload.amountCfa,
      amountNaira: payload.amountNaira,
      exchangeRate: payload.exchangeRate,
      note: payload.note,
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((body as { error?: string }).error ?? "Mise a jour impossible");
  }

  return (body as { data: TransactionRow }).data;
}

export function HistoryTransactionsList({ filters }: HistoryTransactionsListProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<TransactionRow | null>(null);
  const [editTarget, setEditTarget] = useState<TransactionRow | null>(null);
  const [editOperationType, setEditOperationType] = useState<OperationType>("BUY_NAIRA");
  const [editAmountCfa, setEditAmountCfa] = useState("");
  const [editAmountNaira, setEditAmountNaira] = useState("");
  const [editExchangeRate, setEditExchangeRate] = useState("");
  const [editNote, setEditNote] = useState("");

  const queryKey = useMemo(
    () => ["transactions", "history", filters.clientId ?? "", filters.operationType ?? "", filters.from ?? "", filters.to ?? ""],
    [filters.clientId, filters.operationType, filters.from, filters.to]
  );

  const {
    data,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchTransactionsPage(filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore ? lastPage.pageInfo.nextCursor ?? undefined : undefined,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransactionById,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<InfiniteData<TransactionsPage>>(queryKey);

      queryClient.setQueryData<InfiniteData<TransactionsPage>>(queryKey, (current) => {
        if (!current) return current;

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: page.data.filter((row) => row.id !== id),
          })),
        };
      });

      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    },
    onSuccess: () => {
      toast.success("Transaction supprimée");
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTransaction,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<InfiniteData<TransactionsPage>>(queryKey);

      queryClient.setQueryData<InfiniteData<TransactionsPage>>(queryKey, (current) => {
        if (!current) return current;

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: page.data.map((row) =>
              row.id === payload.id
                ? {
                    ...row,
                    operationType: payload.operationType,
                    amountCfa: payload.amountCfa,
                    amountNaira: payload.amountNaira,
                    exchangeRate: payload.exchangeRate,
                    note: payload.note || null,
                  }
                : row
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(error instanceof Error ? error.message : "Mise a jour impossible");
    },
    onSuccess: () => {
      toast.success("Transaction modifiée");
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const rows = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="h-28 animate-pulse bg-muted/40" />
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={History}
            title="Chargement impossible"
            description={error instanceof Error ? error.message : "Réessaie dans quelques secondes."}
          />
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={History}
            title="Aucune transaction trouvée"
            description="Ajuste les filtres ou enregistre une nouvelle transaction."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{transaction.client.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateFull(transaction.transactionDate)} à {formatTime(transaction.transactionDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={transaction.operationType === "BUY_NAIRA" ? "success" : "warning"}>
                    {formatOperationType(transaction.operationType)}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditTarget(transaction);
                      setEditOperationType(transaction.operationType);
                      setEditAmountCfa(String(transaction.amountCfa));
                      setEditAmountNaira(String(transaction.amountNaira));
                      setEditExchangeRate(String(transaction.exchangeRate));
                      setEditNote(transaction.note ?? "");
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteTarget(transaction)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
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

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              "Charger plus"
            )}
          </Button>
        </div>
      )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer la transaction</DialogTitle>
            <DialogDescription>
              Cette action est irreversible. La transaction de {deleteTarget?.client.fullName ?? "ce client"} sera supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending || !deleteTarget}
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteMutation.mutateAsync(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la transaction</DialogTitle>
            <DialogDescription>
              Ajustez rapidement les montants et le type d&apos;opération.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-operation-type">Type d&apos;opération</Label>
              <select
                id="edit-operation-type"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editOperationType}
                onChange={(event) => setEditOperationType(event.target.value as OperationType)}
              >
                <option value="BUY_NAIRA">Achat Naira</option>
                <option value="SELL_NAIRA">Vente Naira</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-amount-cfa">Montant CFA</Label>
                <Input
                  id="edit-amount-cfa"
                  type="number"
                  min="1"
                  step="0.01"
                  value={editAmountCfa}
                  onChange={(event) => setEditAmountCfa(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-amount-naira">Montant Naira</Label>
                <Input
                  id="edit-amount-naira"
                  type="number"
                  min="1"
                  step="0.01"
                  value={editAmountNaira}
                  onChange={(event) => setEditAmountNaira(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-exchange-rate">Taux</Label>
              <Input
                id="edit-exchange-rate"
                type="number"
                min="0.0001"
                step="0.0001"
                value={editExchangeRate}
                onChange={(event) => setEditExchangeRate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-note">Note (optionnel)</Label>
              <Textarea
                id="edit-note"
                maxLength={500}
                value={editNote}
                onChange={(event) => setEditNote(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={
                updateMutation.isPending ||
                !editTarget ||
                Number(editAmountCfa) <= 0 ||
                Number(editAmountNaira) <= 0 ||
                Number(editExchangeRate) <= 0
              }
              onClick={async () => {
                if (!editTarget) return;

                await updateMutation.mutateAsync({
                  id: editTarget.id,
                  operationType: editOperationType,
                  amountCfa: Number(editAmountCfa),
                  amountNaira: Number(editAmountNaira),
                  exchangeRate: Number(editExchangeRate),
                  note: editNote.trim(),
                });

                setEditTarget(null);
              }}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
