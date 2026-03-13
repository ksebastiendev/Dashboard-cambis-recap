import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCfa, formatDateShort, formatNumber } from "@/lib/formatters";
import { listClientsWithStats } from "@/server/services/clientService";
import { CreateClientInlineForm } from "@/components/clients/CreateClientInlineForm";

export const metadata: Metadata = {
  title: "Clients",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || undefined;
  const clients = await listClientsWithStats(query);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Gérer, rechercher et suivre vos clients"
        icon={Users}
        action={<CreateClientInlineForm />}
      />

      <form className="flex flex-col gap-2 sm:flex-row" action="/clients" method="GET">
        <Input
          name="q"
          placeholder="Rechercher par nom, surnom ou téléphone"
          defaultValue={query ?? ""}
        />
        <div className="flex gap-2">
          <Button type="submit" variant="outline">
            Rechercher
          </Button>
          {query && (
            <Button asChild variant="ghost">
              <Link href="/clients">Réinitialiser</Link>
            </Button>
          )}
        </div>
      </form>

      {clients.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Users}
              title="Aucun client trouvé"
              description={
                query
                  ? "Essaie un autre terme de recherche ou crée un nouveau client."
                  : "Commence par créer ton premier client."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base leading-snug">
                      <Link href={`/clients/${client.id}`} className="hover:underline">
                        {client.fullName}
                      </Link>
                    </CardTitle>
                    {client.nickname && (
                      <p className="text-xs text-muted-foreground">Alias: {client.nickname}</p>
                    )}
                  </div>
                  <Badge variant={client.isActive ? "success" : "muted"}>
                    {client.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">Téléphone: {client.phone ?? "—"}</p>
                <p>
                  Transactions: <span className="font-medium">{formatNumber(client.transactionCount)}</span>
                </p>
                <p>
                  Volume total: <span className="font-medium">{formatCfa(client.totalVolumeCfa)}</span>
                </p>
                <p className="text-muted-foreground">
                  Dernière activité: {client.lastTransactionDate ? formatDateShort(client.lastTransactionDate) : "—"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
