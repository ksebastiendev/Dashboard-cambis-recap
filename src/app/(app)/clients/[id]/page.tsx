import { notFound } from "next/navigation";
import { UserRound, DollarSign, ArrowRightLeft, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

type ClientRole = "DOLLAR_SELLER" | "DOLLAR_BUYER" | "NAIRA_BUYER";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  formatCfa,
  formatDateFull,
  formatDateShort,
  formatNaira,
} from "@/lib/formatters";
import { getClientDetail } from "@/server/services/clientService";
import { EditClientForm } from "@/components/clients/EditClientForm";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";

const ROLE_LABELS: Record<ClientRole, string> = {
  DOLLAR_SELLER: "Vendeur $",
  DOLLAR_BUYER: "Acheteur $",
  NAIRA_BUYER: "Acheteur ₦",
};

const OP_LABELS: Record<string, { label: string; color: string }> = {
  TYPE_A: { label: "Achat $", color: "bg-primary/10 text-primary" },
  TYPE_B: { label: "Vente $ → ₦", color: "bg-foreground/10 text-foreground" },
  TYPE_C: { label: "Vente ₦ → CFA", color: "bg-muted text-muted-foreground" },
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getClientDetail(id);

  if (!detail) notFound();

  const { client, opStats, recentOps } = detail;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <PageHeader
        title={client.fullName}
        description={`Client créé le ${formatDateFull(client.createdAt)}`}
        icon={UserRound}
      />

      {/* Client type badges */}
      {client.types.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {client.types.map((t: ClientRole) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {ROLE_LABELS[t]}
            </span>
          ))}
        </div>
      )}

      {/* V2 operation stats — 3 blocs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs flex items-center gap-1"><DollarSign className="h-3 w-3" /> Achat $</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {opStats.typeA.count}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                op.
              </span>
            </CardTitle>
          </CardHeader>
          {opStats.typeA.count > 0 && (
            <CardContent className="text-xs text-muted-foreground space-y-0.5">
              <p>$ {Number(opStats.typeA.totalUsd).toLocaleString("fr-FR")}</p>
              <p>{formatCfa(Number(opStats.typeA.totalCfaSpent))} dépensé</p>
            </CardContent>
          )}
        </Card>

        <Card className="border-l-4 border-l-foreground/30">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs flex items-center gap-1"><ArrowRightLeft className="h-3 w-3" /> Vente $ → ₦</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {opStats.typeB.count}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                op.
              </span>
            </CardTitle>
          </CardHeader>
          {opStats.typeB.count > 0 && (
            <CardContent className="text-xs text-muted-foreground space-y-0.5">
              <p>$ {Number(opStats.typeB.totalUsd).toLocaleString("fr-FR")}</p>
              <p>{formatNaira(Number(opStats.typeB.totalNgnReceived))} reçu</p>
            </CardContent>
          )}
        </Card>

        <Card className="border-l-4 border-l-foreground/15">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Vente ₦ → CFA</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {opStats.typeC.count}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                op.
              </span>
            </CardTitle>
          </CardHeader>
          {opStats.typeC.count > 0 && (
            <CardContent className="text-xs text-muted-foreground space-y-0.5">
              <p>{formatNaira(Number(opStats.typeC.totalNgn))} vendu</p>
              <p>{formatCfa(Number(opStats.typeC.totalCfaReceived))} reçu</p>
              {opStats.typeC.lastOperationDate && (
                <p>Dernier : {formatDateShort(opStats.typeC.lastOperationDate)}</p>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Informations client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditClientForm
            id={client.id}
            initialData={{
              fullName: client.fullName,
              nickname: client.nickname,
              phone: client.phone,
              note: client.note ?? null,
              isActive: client.isActive,
            }}
          />
          <div className="pt-2 border-t border-zinc-100">
            <DeleteClientButton id={client.id} />
          </div>
        </CardContent>
      </Card>

      {/* V2 operation history */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des opérations</CardTitle>
          <CardDescription>
            Les 30 opérations V2 les plus récentes de ce client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOps.length === 0 ? (
            <EmptyState
              title="Aucune opération V2"
              description="Ce client n'a pas encore d'opération enregistrée."
            />
          ) : (
            <div className="space-y-2">
              {recentOps.map((op) => {
                const cfg = OP_LABELS[op.type] ?? {
                  label: op.type,
                  color: "bg-muted text-muted-foreground",
                };
                return (
                  <div
                    key={op.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {formatDateFull(op.operationDate)}
                      </p>
                    </div>
                    <div className="grid gap-1 text-sm sm:grid-cols-2">
                      {op.type === "TYPE_A" && (
                        <>
                          <p>
                            Montant:{" "}
                            <span className="font-medium">
                              $ {Number(op.amountUsd).toLocaleString("fr-FR")}
                            </span>
                          </p>
                          <p>
                            Taux:{" "}
                            <span className="font-medium">
                              {Number(op.rateCfaPerUsd).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} CFA/$
                            </span>
                          </p>
                          <p>
                            Total CFA:{" "}
                            <span className="font-medium">
                              {formatCfa(Number(op.totalCfaSpent))}
                            </span>
                          </p>
                        </>
                      )}
                      {op.type === "TYPE_B" && (
                        <>
                          <p>
                            Montant:{" "}
                            <span className="font-medium">
                              $ {Number(op.amountUsd).toLocaleString("fr-FR")}
                            </span>
                          </p>
                          <p>
                            Taux:{" "}
                            <span className="font-medium">
                              {Number(op.rateNgnPerUsd).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ₦/$
                            </span>
                          </p>
                          <p>
                            Naira reçu:{" "}
                            <span className="font-medium">
                              {formatNaira(Number(op.totalNgnReceived))}
                            </span>
                          </p>
                        </>
                      )}
                      {op.type === "TYPE_C" && (
                        <>
                          <p>
                            Montant:{" "}
                            <span className="font-medium">
                              {formatNaira(Number(op.amountNgn))}
                            </span>
                          </p>
                          <p>
                            Taux:{" "}
                            <span className="font-medium">
                              {Number(op.rateCfaPerNgn).toLocaleString("fr-FR", {
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 4,
                              })}{" "}
                              CFA/₦
                            </span>
                          </p>
                          <p>
                            CFA reçu:{" "}
                            <span className="font-medium">
                              {formatCfa(Number(op.totalCfaReceived))}
                            </span>
                          </p>
                        </>
                      )}
                      {op.note && (
                        <p className="sm:col-span-2 text-muted-foreground text-xs mt-1">
                          Note : {op.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
