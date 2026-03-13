import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export const metadata: Metadata = {
  title: "Clients",
};

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Gérer vos clients"
        icon={Users}
        action={
          <Button size="sm" disabled>
            <UserPlus className="h-4 w-4" />
            Nouveau client
          </Button>
        }
      />

      {/* TODO Phase 2 — ClientTable, ClientSearch */}
      <p className="text-muted-foreground text-sm">
        La gestion clients sera implémentée en Phase 2.
      </p>
    </div>
  );
}
