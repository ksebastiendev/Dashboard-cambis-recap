import { UserRound } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Détail client"
        description={`Client: ${id}`}
        icon={UserRound}
      />

      <Card>
        <CardHeader>
          <CardTitle>Fiche client</CardTitle>
          <CardDescription>
            Les statistiques et l'historique seront branchés au module clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            Emplacement réservé pour les informations client et ses transactions.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
