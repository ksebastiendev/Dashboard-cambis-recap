"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowRightLeft } from "lucide-react";

type OpType = "TYPE_A" | "TYPE_B" | "TYPE_C";

const TYPE_CONFIG = {
  TYPE_A: {
    label: "Achat $",
    title: "Achat de dollars (CFA → $)",
    amountLabel: "Montant en dollars ($)",
    amountPlaceholder: "Ex : 500",
    amountUnit: "$",
    rateLabel: "Taux CFA par dollar (CFA/$)",
    ratePlaceholder: "Ex : 620",
    totalLabel: "Total CFA dépensé",
    totalUnit: "CFA",
    totalFormula: (amount: number, rate: number) => amount * rate,
    colorClass: "bg-emerald-600 hover:bg-emerald-700",
  },
  TYPE_B: {
    label: "Vente $ → ₦",
    title: "Vente dollars contre Naira ($ → ₦)",
    amountLabel: "Montant en dollars ($)",
    amountPlaceholder: "Ex : 500",
    amountUnit: "$",
    rateLabel: "Taux Naira par dollar (₦/$)",
    ratePlaceholder: "Ex : 1650",
    totalLabel: "Total Naira reçu",
    totalUnit: "₦",
    totalFormula: (amount: number, rate: number) => amount * rate,
    colorClass: "bg-blue-600 hover:bg-blue-700",
  },
  TYPE_C: {
    label: "Vente ₦ → CFA",
    title: "Vente Naira contre CFA (₦ → CFA)",
    amountLabel: "Montant en Naira (₦)",
    amountPlaceholder: "Ex : 800000",
    amountUnit: "₦",
    rateLabel: "Taux CFA par Naira (CFA/₦)",
    ratePlaceholder: "Ex : 0.38",
    totalLabel: "Total CFA reçu",
    totalUnit: "CFA",
    totalFormula: (amount: number, rate: number) => amount * rate,
    colorClass: "bg-orange-500 hover:bg-orange-600",
  },
} as const;

const formSchema = z.object({
  amount: z.number().positive("Le montant doit être supérieur à 0"),
  rate: z.number().positive("Le taux doit être supérieur à 0"),
  clientId: z.string().optional(),
  operationDate: z.string().optional(),
  note: z.string().max(500).trim().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ClientOption {
  id: string;
  fullName: string;
  phone?: string | null;
}

function ClientPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (id: string | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [open, setOpen] = useState(false);

  const { data } = useQuery<{ data: ClientOption[] }>({
    queryKey: ["clients-search", query],
    queryFn: () =>
      fetch(`/api/clients/search?q=${encodeURIComponent(query)}`).then((r) =>
        r.json()
      ),
    staleTime: 10_000,
  });

  const clients = data?.data ?? [];

  return (
    <div className="relative">
      <Input
        value={value ? selectedLabel : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedLabel("");
          onChange(undefined);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Rechercher un client (optionnel)"
        className="min-h-12 text-base"
        autoComplete="off"
      />
      {open && clients.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
          {clients.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(c.id);
                  setSelectedLabel(c.fullName);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-3 text-sm hover:bg-accent text-left"
              >
                <span className="font-medium">{c.fullName}</span>
                {c.phone && (
                  <span className="text-muted-foreground text-xs ml-auto">
                    {c.phone}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OperationForm({
  type,
  onSuccess,
}: {
  type: OpType;
  onSuccess: () => void;
}) {
  const config = TYPE_CONFIG[type];
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operationDate: new Date().toISOString().slice(0, 10),
    },
  });

  const [amount, rate] = watch(["amount", "rate"]);
  const total =
    Number(amount) > 0 && Number(rate) > 0
      ? config.totalFormula(Number(amount), Number(rate))
      : null;

  const onSubmit = async (values: FormValues) => {
    let payload: Record<string, unknown>;

    if (type === "TYPE_A") {
      payload = { type, amountUsd: values.amount, rateCfaPerUsd: values.rate };
    } else if (type === "TYPE_B") {
      payload = { type, amountUsd: values.amount, rateNgnPerUsd: values.rate };
    } else {
      payload = { type, amountNgn: values.amount, rateCfaPerNgn: values.rate };
    }

    if (values.clientId) payload.clientId = values.clientId;
    if (values.operationDate) {
      payload.operationDate = new Date(values.operationDate + "T12:00:00").toISOString();
    }
    if (values.note) payload.note = values.note;

    const res = await fetch("/api/operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "Erreur lors de l'enregistrement");
      return;
    }

    toast.success("Opération enregistrée !");
    queryClient.invalidateQueries({ queryKey: ["operations"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    router.refresh();
    reset({ operationDate: new Date().toISOString().slice(0, 10) });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-2">
      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${type}-amount`}>{config.amountLabel}</Label>
        <Input
          id={`${type}-amount`}
          inputMode="decimal"
          placeholder={config.amountPlaceholder}
          className="min-h-12 text-base"
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {/* Rate */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${type}-rate`}>{config.rateLabel}</Label>
        <Input
          id={`${type}-rate`}
          inputMode="decimal"
          placeholder={config.ratePlaceholder}
          className="min-h-12 text-base"
          {...register("rate", { valueAsNumber: true })}
        />
        {errors.rate && (
          <p className="text-xs text-destructive">{errors.rate.message}</p>
        )}
      </div>

      {/* Real-time total */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-center transition-all duration-200",
          total !== null
            ? "border-primary/30 bg-primary/5"
            : "border-dashed border-muted-foreground/30 bg-muted/30"
        )}
      >
        <p className="text-xs text-muted-foreground mb-0.5">
          {config.totalLabel}
        </p>
        <p className="text-2xl font-bold tabular-nums">
          {total !== null
            ? total.toLocaleString("fr-FR", { maximumFractionDigits: 0 })
            : "—"}
          <span className="ml-1.5 text-base font-medium text-muted-foreground">
            {config.totalUnit}
          </span>
        </p>
      </div>

      {/* Client picker */}
      <div className="flex flex-col gap-1.5">
        <Label>Client (optionnel)</Label>
        <ClientPicker
          value={watch("clientId")}
          onChange={(id) => setValue("clientId", id)}
        />
      </div>

      {/* Date */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${type}-date`}>Date</Label>
        <Input
          id={`${type}-date`}
          type="date"
          className="min-h-12"
          {...register("operationDate")}
        />
      </div>

      {/* Note */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${type}-note`}>Note (optionnel)</Label>
        <Input
          id={`${type}-note`}
          placeholder="Remarque..."
          className="min-h-12"
          {...register("note")}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 text-base font-semibold mt-1"
      >
        {isSubmitting ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}

export function OperationsClient() {
  const [activeType, setActiveType] = useState<OpType | null>(null);
  const closeDialog = useCallback(() => setActiveType(null), []);

  return (
    <>
      <div className="flex flex-col gap-3">
        {(["TYPE_A", "TYPE_B", "TYPE_C"] as OpType[]).map((type) => {
          const config = TYPE_CONFIG[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={cn(
                "flex items-center justify-between rounded-2xl px-5 py-5 text-white min-h-18 shadow-md transition-all active:scale-[0.98] cursor-pointer",
                config.colorClass
              )}
            >
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="w-5 h-5 opacity-90" />
                <span className="text-lg font-bold">{config.label}</span>
              </div>
              <span className="text-3xl font-light opacity-70">+</span>
            </button>
          );
        })}
      </div>

      {(["TYPE_A", "TYPE_B", "TYPE_C"] as OpType[]).map((type) => (
        <Dialog
          key={type}
          open={activeType === type}
          onOpenChange={(open) => !open && closeDialog()}
        >
          <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                {TYPE_CONFIG[type].title}
              </DialogTitle>
            </DialogHeader>
            {activeType === type && (
              <OperationForm type={type} onSuccess={closeDialog} />
            )}
          </DialogContent>
        </Dialog>
      ))}
    </>
  );
}
