"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function CreateClientInlineForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      nickname: String(formData.get("nickname") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      note: String(formData.get("note") ?? ""),
    };

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? "Impossible de créer le client");
        return;
      }

      event.currentTarget.reset();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessaie.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        Nouveau client
      </Button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-border bg-card p-4 shadow-sm md:w-105">
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nom</Label>
          <Input id="fullName" name="fullName" required minLength={2} maxLength={100} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">Surnom</Label>
            <Input id="nickname" name="nickname" maxLength={50} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" name="phone" maxLength={20} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note">Note</Label>
          <Textarea id="note" name="note" maxLength={500} />
        </div>

        {error && (
          <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Créer"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
