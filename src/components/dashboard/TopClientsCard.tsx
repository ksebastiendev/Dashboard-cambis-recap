import Link from "next/link";
import type { TopClient } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCfa, formatDateShort, formatNumber } from "@/lib/formatters";

interface TopClientsCardProps {
  clients: TopClient[];
}

export function TopClientsCard({ clients }: TopClientsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top clients</CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune donnée client disponible.</p>
        ) : (
          <div className="space-y-3">
            {clients.map((client, index) => (
              <div key={client.clientId} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">#{index + 1}</Badge>
                    <Link href={`/clients/${client.clientId}`} className="truncate text-sm font-medium hover:underline">
                      {client.fullName}
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(client.transactionCount)} transactions • Dernière activité {formatDateShort(client.lastTransactionDate)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium">{formatCfa(client.totalVolumeCfa)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}