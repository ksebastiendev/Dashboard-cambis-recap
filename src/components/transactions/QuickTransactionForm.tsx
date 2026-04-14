"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { formatNumber } from "@/lib/formatters";

interface ClientChoice {
  id: string;
  fullName: string;
  nickname: string | null;
  phone: string | null;
}

interface QuickTransactionFormProps {
  clients: ClientChoice[];
}

interface CreateClientPayload {
  fullName: string;
  phone: string;
}

interface CreateTransactionPayload {
  clientId: string;
  operationType: "BUY_NAIRA" | "SELL_NAIRA";
  amountCfa: number;
  amountNaira: number;
  exchangeRate: number;
  note: string;
}

interface ClientSearchApiItem {
  id: string;
  fullName: string;
  nickname?: string | null;
  phone?: string | null;
}

interface ClientSearchApiResponse {
  data?: ClientSearchApiItem[];
  error?: string;
}

async function fetchClients(query: string): Promise<ClientChoice[]> {
  const queryString = new URLSearchParams();
  if (query.trim()) {
    queryString.set("q", query.trim());
  }

  const response = await fetch(`/api/clients/search?${queryString.toString()}`, {
    method: "GET",
  });
  const body = (await response.json()) as ClientSearchApiResponse;

  if (!response.ok) {
    throw new Error(body.error ?? "Impossible de charger les clients");
  }

  return (body.data ?? []).map((client) => ({
    id: client.id,
    fullName: client.fullName,
    nickname: client.nickname ?? null,
    phone: client.phone ?? null,
  }));
}

async function createClient(payload: CreateClientPayload): Promise<ClientChoice> {
  const response = await fetch("/api/clients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Impossible de créer le client");
  }

  const created = body.data;
  return {
    id: created.id,
    fullName: created.fullName,
    nickname: created.nickname ?? null,
    phone: created.phone ?? null,
  };
}

async function createTransaction(payload: CreateTransactionPayload) {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Impossible d'enregistrer la transaction");
  }

  return body.data;
}

export function QuickTransactionForm({ clients }: QuickTransactionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? "");
  const [clientSearch, setClientSearch] = useState("");

  const [amountCfa, setAmountCfa] = useState("");
  const [amountNaira, setAmountNaira] = useState("");
  const [exchangeRateInput, setExchangeRateInput] = useState("");
  const [note, setNote] = useState("");
  const [operationType, setOperationType] = useState<"BUY_NAIRA" | "SELL_NAIRA">("BUY_NAIRA");

  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const computedRate = useMemo(() => {
    const cfa = Number(amountCfa);
    const naira = Number(amountNaira);

    if (!Number.isFinite(cfa) || !Number.isFinite(naira) || naira <= 0 || cfa <= 0) {
      return null;
    }

    return cfa / naira;
  }, [amountCfa, amountNaira]);

  const clientsQuery = useQuery({
    queryKey: ["client-search", clientSearch],
    queryFn: () => fetchClients(clientSearch),
    placeholderData: (previousData) => previousData,
  });

  const availableClients = useMemo(() => {
    const merged = [...clients, ...(clientsQuery.data ?? [])];
    const byId = new Map(merged.map((client) => [client.id, client]));
    return Array.from(byId.values());
  }, [clients, clientsQuery.data]);

  const selectedClient = useMemo(() => {
    return availableClients.find((client) => client.id === selectedClientId) ?? null;
  }, [availableClients, selectedClientId]);

  const pickerClients = clientsQuery.data ?? availableClients;

  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: (createdClient) => {
      toast.success("Client créé");
      setSelectedClientId(createdClient.id);
      setCreateClientOpen(false);
      setPickerOpen(false);
      setClientSearch("");
      setNewClientName("");
      setNewClientPhone("");
      queryClient.invalidateQueries({ queryKey: ["client-search"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "history"] });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur de création");
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      toast.success("Transaction enregistrée");
      setAmountCfa("");
      setAmountNaira("");
      setExchangeRateInput("");
      setNote("");
      setOperationType("BUY_NAIRA");
      queryClient.invalidateQueries({ queryKey: ["transactions", "history"] });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur réseau");
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cfa = Number(amountCfa);
    const naira = Number(amountNaira);

    const payload: CreateTransactionPayload = {
      clientId: selectedClientId,
      operationType,
      amountCfa: cfa,
      amountNaira: naira,
      exchangeRate:
        exchangeRateInput.trim().length > 0
          ? Number(exchangeRateInput)
          : cfa > 0 && naira > 0
            ? cfa / naira
            : 0,
      note,
    };

    await createTransactionMutation.mutateAsync(payload);
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Client</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreateClientOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Nouveau client
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-between"
              onClick={() => setPickerOpen(true)}
            >
              <span className="truncate text-left">
                {selectedClient ? selectedClient.fullName : "Sélectionner un client"}
              </span>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="operationType">Type d&apos;opération</Label>
            <select
              id="operationType"
              name="operationType"
              required
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={operationType}
              onChange={(event) =>
                setOperationType(event.target.value as "BUY_NAIRA" | "SELL_NAIRA")
              }
            >
              <option value="BUY_NAIRA">Achat Naira</option>
              <option value="SELL_NAIRA">Vente Naira</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amountCfa">Montant CFA</Label>
            <Input
              id="amountCfa"
              name="amountCfa"
              type="number"
              min="1"
              step="0.01"
              placeholder="150000"
              required
              value={amountCfa}
              onChange={(event) => setAmountCfa(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amountNaira">Montant Naira</Label>
            <Input
              id="amountNaira"
              name="amountNaira"
              type="number"
              min="1"
              step="0.01"
              placeholder="350000"
              required
              value={amountNaira}
              onChange={(event) => setAmountNaira(event.target.value)}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="exchangeRate">Taux</Label>
            <Input
              id="exchangeRate"
              name="exchangeRate"
              type="number"
              min="0.0001"
              step="0.0001"
              placeholder="2.2500"
              required
              value={exchangeRateInput}
              onChange={(event) => setExchangeRateInput(event.target.value)}
            />
            {computedRate && (
              <p className="text-xs text-muted-foreground">
                Taux calculé automatiquement: {formatNumber(Number(computedRate.toFixed(4)))}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              name="note"
              maxLength={500}
              placeholder="Détail rapide"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={createTransactionMutation.isPending || !selectedClientId}
          >
            {createTransactionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer la transaction"
            )}
          </Button>
        </div>
      </form>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sélectionner un client</DialogTitle>
            <DialogDescription>Recherche rapide par nom, surnom ou téléphone.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Rechercher..."
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
            />

            <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {clientsQuery.isLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </div>
              ) : pickerClients.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucun client trouvé.
                </p>
              ) : (
                pickerClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setPickerOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-accent"
                  >
                    <span className="truncate text-sm font-medium">{client.fullName}</span>
                    <span className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
                      {client.phone ? client.phone : ""}
                      {selectedClientId === client.id && <Check className="h-4 w-4 text-primary" />}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createClientOpen} onOpenChange={setCreateClientOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogDescription>Créez rapidement un client sans quitter la transaction.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="newClientName">Nom</Label>
              <Input
                id="newClientName"
                value={newClientName}
                onChange={(event) => setNewClientName(event.target.value)}
                placeholder="Nom du client"
                minLength={2}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newClientPhone">Téléphone (optionnel)</Label>
              <Input
                id="newClientPhone"
                value={newClientPhone}
                onChange={(event) => setNewClientPhone(event.target.value)}
                placeholder="+234 ..."
                maxLength={20}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateClientOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={createClientMutation.isPending || newClientName.trim().length < 2}
              onClick={async () => {
                await createClientMutation.mutateAsync({
                  fullName: newClientName.trim(),
                  phone: newClientPhone.trim(),
                });
              }}
            >
              {createClientMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer et sélectionner"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
