"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteClientButton({ id }: { id: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "confirm" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setMode("loading");
    setError(null);

    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Impossible de supprimer ce client");
        setMode("confirm");
        return;
      }
      router.push("/clients");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessaie.");
      setMode("confirm");
    }
  };

  if (mode === "idle") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setMode("confirm")}
      >
        <Trash2 className="h-4 w-4" />
        Supprimer le client
      </Button>
    );
  }

  if (mode === "confirm" || mode === "loading") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 space-y-3">
        <p className="text-sm font-medium text-destructive">
          Supprimer ce client définitivement ?
        </p>
        <p className="text-xs text-zinc-500">
          Le client sera masqué. Ses opérations existantes restent dans l&apos;historique.
        </p>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setMode("idle"); setError(null); }}
            disabled={mode === "loading"}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={mode === "loading"}
          >
            {mode === "loading" ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Suppression...</>
            ) : (
              "Confirmer la suppression"
            )}
          </Button>
        </div>
      </div>
    );
  }
}
