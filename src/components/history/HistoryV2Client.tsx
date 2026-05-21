"use client";

import { useState, type ComponentType } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { X, ChevronDown, Loader2, DollarSign, ArrowRightLeft, RefreshCw } from "lucide-react";
import { RowActions } from "@/components/shared/RowActions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatCfa,
  formatNaira,
  formatDateFull,
  formatDateShort,
} from "@/lib/formatters";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type OpType = "TYPE_A" | "TYPE_B" | "TYPE_C";

interface ApiOperation {
  id: string;
  type: OpType;
  amountUsd: string | null;
  amountNgn: string | null;
  rateCfaPerUsd: string | null;
  rateNgnPerUsd: string | null;
  rateCfaPerNgn: string | null;
  totalCfaSpent: string | null;
  totalNgnReceived: string | null;
  totalCfaReceived: string | null;
  operationDate: string;
  note: string | null;
  clientId: string | null;
  client: { id: string; fullName: string; phone: string | null } | null;
}

interface PageData {
  data: ApiOperation[];
  pageInfo: { nextCursor: string | null; hasMore: boolean };
}

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────

const TYPE_FILTERS: Array<{ value: OpType | ""; label: string; Icon?: ComponentType<{ className?: string }> }> = [
  { value: "", label: "Tous" },
  { value: "TYPE_A", label: "Achat $", Icon: DollarSign },
  { value: "TYPE_B", label: "Vente $ → ₦", Icon: ArrowRightLeft },
  { value: "TYPE_C", label: "Vente ₦ → CFA", Icon: RefreshCw },
];

const OP_CONFIG: Record<
  OpType,
  { label: string; colorClass: string; amountField: string; rateField: string; amountLabel: string; rateLabel: string; totalLabel: string; totalKey: keyof ApiOperation }
> = {
  TYPE_A: {
    label: "Achat $",
    colorClass: "bg-primary/10 text-primary",
    amountField: "amountUsd",
    rateField: "rateCfaPerUsd",
    amountLabel: "Montant ($)",
    rateLabel: "Taux (CFA/$)",
    totalLabel: "CFA dépensé",
    totalKey: "totalCfaSpent",
  },
  TYPE_B: {
    label: "Vente $ → ₦",
    colorClass: "bg-foreground/10 text-foreground",
    amountField: "amountUsd",
    rateField: "rateNgnPerUsd",
    amountLabel: "Montant ($)",
    rateLabel: "Taux (₦/$)",
    totalLabel: "₦ reçu",
    totalKey: "totalNgnReceived",
  },
  TYPE_C: {
    label: "Vente ₦ → CFA",
    colorClass: "bg-muted text-muted-foreground",
    amountField: "amountNgn",
    rateField: "rateCfaPerNgn",
    amountLabel: "Montant (₦)",
    rateLabel: "Taux (CFA/₦)",
    totalLabel: "CFA reçu",
    totalKey: "totalCfaReceived",
  },
};

// ─────────────────────────────────────────
// Edit form schema + component
// ─────────────────────────────────────────

const editSchema = z.object({
  amount: z.number().positive("Le montant doit être supérieur à 0"),
  rate: z.number().positive("Le taux doit être supérieur à 0"),
  operationDate: z.string().optional(),
  note: z.string().max(500).trim().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

function formatTotal(op: ApiOperation): string {
  const cfg = OP_CONFIG[op.type];
  const raw = op[cfg.totalKey];
  if (!raw) return "—";
  const n = Number(raw);
  if (op.type === "TYPE_A") return formatCfa(n);
  if (op.type === "TYPE_B") return formatNaira(n);
  return formatCfa(n);
}

function formatAmount(op: ApiOperation): string {
  if (op.type === "TYPE_C") {
    return `${formatNaira(Number(op.amountNgn))}`;
  }
  return `$ ${Number(op.amountUsd).toLocaleString("fr-FR")}`;
}

function formatRate(op: ApiOperation): string {
  if (op.type === "TYPE_A") {
    return `${Number(op.rateCfaPerUsd).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} CFA/$`;
  }
  if (op.type === "TYPE_B") {
    return `${Number(op.rateNgnPerUsd).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ₦/$`;
  }
  return `${Number(op.rateCfaPerNgn).toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} CFA/₦`;
}

function EditForm({
  op,
  onCancel,
  onSaved,
}: {
  op: ApiOperation;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const cfg = OP_CONFIG[op.type];
  const qc = useQueryClient();

  const initialAmount = Number(
    op.type === "TYPE_C" ? op.amountNgn : op.amountUsd
  );
  const initialRate = Number(
    op.type === "TYPE_A"
      ? op.rateCfaPerUsd
      : op.type === "TYPE_B"
      ? op.rateNgnPerUsd
      : op.rateCfaPerNgn
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      amount: initialAmount,
      rate: initialRate,
      operationDate: op.operationDate.slice(0, 10),
      note: op.note ?? "",
    },
  });

  const [amount, rate] = watch(["amount", "rate"]);
  const total =
    Number(amount) > 0 && Number(rate) > 0 ? Number(amount) * Number(rate) : null;

  const onSubmit = async (values: EditFormValues) => {
    let payload: Record<string, unknown> = {};
    if (op.type === "TYPE_A") {
      payload = { amountUsd: values.amount, rateCfaPerUsd: values.rate };
    } else if (op.type === "TYPE_B") {
      payload = { amountUsd: values.amount, rateNgnPerUsd: values.rate };
    } else {
      payload = { amountNgn: values.amount, rateCfaPerNgn: values.rate };
    }
    if (values.operationDate) {
      payload.operationDate = new Date(values.operationDate + "T12:00:00").toISOString();
    }
    if (values.note !== undefined) payload.note = values.note;

    const res = await fetch(`/api/operations/${op.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "Erreur lors de la modification");
      return;
    }

    toast.success("Opération mise à jour");
    qc.invalidateQueries({ queryKey: ["operations"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    onSaved();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{cfg.amountLabel}</Label>
          <Input
            inputMode="decimal"
            className="h-9 text-sm"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{cfg.rateLabel}</Label>
          <Input
            inputMode="decimal"
            className="h-9 text-sm"
            {...register("rate", { valueAsNumber: true })}
          />
          {errors.rate && (
            <p className="text-xs text-destructive">{errors.rate.message}</p>
          )}
        </div>
      </div>

      {total !== null && (
        <p className="text-xs text-zinc-500">
          {cfg.totalLabel} :{" "}
          <span className="font-semibold text-zinc-900">
            {op.type === "TYPE_B"
              ? formatNaira(total)
              : formatCfa(total)}
          </span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input type="date" className="h-9 text-sm" {...register("operationDate")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Note</Label>
          <Input className="h-9 text-sm" placeholder="Remarque..." {...register("note")} />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────
// Operation row
// ─────────────────────────────────────────

function OperationRow({ op }: { op: ApiOperation }) {
  const [editing, setEditing] = useState(false);
  const qc = useQueryClient();
  const cfg = OP_CONFIG[op.type];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
              cfg.colorClass
            )}
          >
            {cfg.label}
          </span>
          {op.client && (
            <span className="text-sm font-medium text-zinc-800">{op.client.fullName}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-400 mr-1">
            {formatDateShort(op.operationDate)}
          </span>
          {editing ? (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md px-2 py-1 text-xs text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </button>
          ) : (
            <RowActions
              onEdit={() => setEditing(true)}
              onDelete={async () => {
                const r = await fetch(`/api/operations/${op.id}`, { method: "DELETE" });
                if (!r.ok) throw new Error("Impossible de supprimer cette opération");
                toast.success("Opération supprimée");
                qc.invalidateQueries({ queryKey: ["operations"] });
                qc.invalidateQueries({ queryKey: ["dashboard"] });
              }}
              confirmMessage="Cette opération sera définitivement supprimée."
            />
          )}
        </div>
      </div>

      {/* Amounts */}
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-zinc-500">
          {cfg.amountLabel.replace(" ($)", "").replace(" (₦)", "")} :{" "}
          <span className="font-semibold text-zinc-900">{formatAmount(op)}</span>
        </span>
        <span className="text-zinc-500">
          Taux :{" "}
          <span className="font-semibold text-zinc-900">{formatRate(op)}</span>
        </span>
        <span className="text-zinc-500">
          {cfg.totalLabel} :{" "}
          <span className="font-semibold text-zinc-900">{formatTotal(op)}</span>
        </span>
      </div>

      {op.note && (
        <p className="mt-1 text-xs text-zinc-400">Note : {op.note}</p>
      )}

      {/* Inline edit form */}
      {editing && (
        <EditForm
          op={op}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export function HistoryV2Client() {
  const [typeFilter, setTypeFilter] = useState<OpType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const queryKey = ["operations", { type: typeFilter, dateFrom, dateTo }] as const;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError } =
    useInfiniteQuery<PageData>({
      queryKey,
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams();
        if (typeFilter) params.set("type", typeFilter);
        if (dateFrom) params.set("dateFrom", dateFrom + "T00:00:00.000Z");
        if (dateTo) params.set("dateTo", dateTo + "T23:59:59.999Z");
        if (pageParam) params.set("cursor", pageParam as string);
        params.set("limit", "20");
        return fetch(`/api/operations?${params}`).then((r) => r.json());
      },
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.pageInfo?.nextCursor ?? null,
      staleTime: 30_000,
    });

  const allOps = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-4">
      {/* Type filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setTypeFilter(f.value)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              typeFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f.Icon && <f.Icon className="h-3.5 w-3.5" />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Du</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-40 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Au</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-40 text-sm"
          />
        </div>
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => { setDateFrom(""); setDateTo(""); }}
          >
            Effacer dates
          </Button>
        )}
      </div>

      {/* List */}
      {isPending && (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Erreur lors du chargement des opérations.
        </p>
      )}

      {!isPending && allOps.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium">Aucune opération</p>
          <p className="text-xs text-muted-foreground mt-1">
            Modifie les filtres ou enregistre ta première opération.
          </p>
        </div>
      )}

      {allOps.length > 0 && (
        <>
          <div className="space-y-2">
            {allOps.map((op) => (
              <OperationRow key={op.id} op={op} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Charger plus
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
