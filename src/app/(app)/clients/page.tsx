import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import type { ClientRole } from "@prisma/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCfa, formatDateShort } from "@/lib/formatters";
import { listClientsWithStats } from "@/server/services/clientService";
import { CreateClientInlineForm } from "@/components/clients/CreateClientInlineForm";
import { ClientCardActions } from "@/components/clients/ClientCardActions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Clients — Cambis Recap" };

const TYPE_FILTERS: Array<{ value: ClientRole | "ALL"; label: string }> = [
  { value: "ALL", label: "Tous" },
  { value: "DOLLAR_SELLER", label: "Vendeurs $" },
  { value: "DOLLAR_BUYER", label: "Acheteurs $" },
  { value: "NAIRA_BUYER", label: "Acheteurs ₦" },
];

const ROLE_LABELS: Record<ClientRole, string> = {
  DOLLAR_SELLER: "Vendeur $",
  DOLLAR_BUYER: "Acheteur $",
  NAIRA_BUYER: "Acheteur ₦",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const query = q?.trim() || undefined;
  const validRoles: ClientRole[] = ["DOLLAR_SELLER", "DOLLAR_BUYER", "NAIRA_BUYER"];
  const typeFilter = validRoles.includes(type as ClientRole)
    ? (type as ClientRole)
    : undefined;

  const clients = await listClientsWithStats(query, typeFilter);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <PageHeader
        title="Clients"
        description="Gérer, rechercher et suivre vos clients"
        icon={Users}
        action={<CreateClientInlineForm />}
      />

      {/* Type filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TYPE_FILTERS.map((f) => {
          const isActive =
            f.value === "ALL" ? !typeFilter : typeFilter === f.value;
          const href =
            f.value === "ALL"
              ? query ? `/clients?q=${encodeURIComponent(query)}` : "/clients"
              : query
              ? `/clients?type=${f.value}&q=${encodeURIComponent(query)}`
              : `/clients?type=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <form className="flex gap-2" action="/clients" method="GET">
        {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
        <Input
          name="q"
          placeholder="Rechercher par nom ou téléphone"
          defaultValue={query ?? ""}
          className="min-h-10"
        />
        <Button type="submit" variant="outline" className="shrink-0">
          Rechercher
        </Button>
        {query && (
          <Button asChild variant="ghost" className="shrink-0">
            <Link href={typeFilter ? `/clients?type=${typeFilter}` : "/clients"}>
              Effacer
            </Link>
          </Button>
        )}
      </form>

      {clients.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Users}
              title="Aucun client trouvé"
              description={
                query || typeFilter
                  ? "Essaie d'autres filtres ou crée un nouveau client."
                  : "Commence par créer ton premier client."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-snug">
                      <Link
                        href={`/clients/${client.id}`}
                        className="hover:underline"
                      >
                        {client.fullName}
                      </Link>
                    </CardTitle>
                    {client.nickname && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {client.nickname}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={client.isActive ? "success" : "muted"}>
                      {client.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    <ClientCardActions
                      id={client.id}
                      name={client.fullName}
                      initialData={{
                        fullName: client.fullName,
                        nickname: client.nickname,
                        phone: client.phone,
                        isActive: client.isActive,
                      }}
                    />
                  </div>
                </div>

                {/* Client type badges */}
                {client.types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {client.types.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500"
                      >
                        {ROLE_LABELS[t]}
                      </span>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-1 text-sm">
                {client.phone && (
                  <p className="text-zinc-500">{client.phone}</p>
                )}
                <p className="text-zinc-400">
                  Dernière activité:{" "}
                  <span className="font-semibold text-zinc-700">
                    {client.lastTransactionDate
                      ? formatDateShort(client.lastTransactionDate)
                      : "—"}
                  </span>
                </p>
                {client.totalVolumeCfa > 0 && (
                  <p className="text-zinc-400">
                    Volume:{" "}
                    <span className="font-semibold text-zinc-700">
                      {formatCfa(client.totalVolumeCfa)}
                    </span>
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
