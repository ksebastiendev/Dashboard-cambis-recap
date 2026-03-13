"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber } from "@/lib/formatters";

interface ClientChoice {
  id: string;
  fullName: string;
  nickname: string | null;
}

interface QuickTransactionFormProps {
  clients: ClientChoice[];
}

export function QuickTransactionForm({ clients }: QuickTransactionFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [amountCfa, setAmountCfa] = useState("");
  const [amountNaira, setAmountNaira] = useState("");
  const [exchangeRateInput, setExchangeRateInput] = useState("");

  const computedRate = useMemo(() => {
    const cfa = Number(amountCfa);
    const naira = Number(amountNaira);

    if (!Number.isFinite(cfa) || !Number.isFinite(naira) || naira <= 0 || cfa <= 0) {
      return null;
    }

    return cfa / naira;
  }, [amountCfa, amountNaira]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const cfa = Number(formData.get("amountCfa"));
    const naira = Number(formData.get("amountNaira"));
    const rateValue = String(formData.get("exchangeRate") ?? "").trim();

    const payload = {
      clientId: String(formData.get("clientId") ?? ""),
      operationType: String(formData.get("operationType") ?? "BUY_NAIRA"),
      amountCfa: cfa,
      amountNaira: naira,
      exchangeRate:
        rateValue.length > 0
          ? Number(rateValue)
          : cfa > 0 && naira > 0
            ? cfa / naira
            : 0,
      note: String(formData.get("note") ?? ""),
    };

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? "Impossible d&apos;enregistrer la transaction");
        return;
      }

      event.currentTarget.reset();
      setAmountCfa("");
      setAmountNaira("");
      setExchangeRateInput("");
      setSuccess("Transaction enregistrée avec succès.");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessaie.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="clientId">Client</Label>
          <select
            id="clientId"
            name="clientId"
            required
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            defaultValue=""
          >
            <option value="" disabled>
              Sélectionner un client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName}
                {client.nickname ? ` (${client.nickname})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="operationType">Type d&apos;opération</Label>
          <select
            id="operationType"
            name="operationType"
            required
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            defaultValue="BUY_NAIRA"
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
          <Textarea id="note" name="note" maxLength={500} placeholder="Détail rapide" />
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-md border border-success/25 bg-success/10 px-3 py-2 text-sm text-success">
          {success}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSaving}>
          {isSaving ? (
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
  );
}