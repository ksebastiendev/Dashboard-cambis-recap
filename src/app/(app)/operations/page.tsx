import { OperationsClient } from "@/components/operations/OperationsClient";

export const metadata = { title: "Opérations — Cambis Recap" };

export default function OperationsPage() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Opérations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enregistrez un achat ou une vente de devises
        </p>
      </div>
      <OperationsClient />
    </div>
  );
}
