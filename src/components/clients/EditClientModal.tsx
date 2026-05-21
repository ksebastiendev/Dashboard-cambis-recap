"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  initialData: {
    fullName: string;
    nickname: string | null;
    phone: string | null;
    note: string | null;
    isActive: boolean;
  };
}

export function EditClientModal({
  open,
  onOpenChange,
  id,
  initialData,
}: EditClientModalProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(initialData.isActive);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      nickname: String(formData.get("nickname") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
      isActive,
    };

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Impossible de mettre à jour le client");
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessaie.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isSaving) onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
        </DialogHeader>

        <form className="space-y-3 mt-2" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="edit-fullName">Nom complet</Label>
            <Input
              id="edit-fullName"
              name="fullName"
              required
              minLength={2}
              maxLength={100}
              defaultValue={initialData.fullName}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nickname">Surnom</Label>
              <Input
                id="edit-nickname"
                name="nickname"
                maxLength={50}
                defaultValue={initialData.nickname ?? ""}
                placeholder="Optionnel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                name="phone"
                maxLength={20}
                defaultValue={initialData.phone ?? ""}
                placeholder="Optionnel"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-note">Note</Label>
            <Input
              id="edit-note"
              name="note"
              maxLength={500}
              defaultValue={initialData.note ?? ""}
              placeholder="Optionnel"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label>Statut</Label>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className="flex items-center gap-2 text-sm"
            >
              <Badge variant={isActive ? "success" : "muted"}>
                {isActive ? "Actif" : "Inactif"}
              </Badge>
              <span className="text-zinc-400 text-xs">(cliquer pour changer)</span>
            </button>
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
