"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface EditClientFormProps {
  id: string;
  initialData: {
    fullName: string;
    nickname: string | null;
    phone: string | null;
    note: string | null;
    isActive: boolean;
  };
}

export function EditClientForm({ id, initialData }: EditClientFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(initialData.isActive);

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
      isActive,
    };

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? "Impossible de mettre à jour le client");
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessaie.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p>Nom: <span className="font-medium">{initialData.fullName}</span></p>
        <p>Surnom: <span className="font-medium">{initialData.nickname ?? "—"}</span></p>
        <p>Téléphone: <span className="font-medium">{initialData.phone ?? "—"}</span></p>
        <p>
          Statut:{" "}
          <Badge variant={initialData.isActive ? "success" : "muted"}>
            {initialData.isActive ? "Actif" : "Inactif"}
          </Badge>
        </p>
        <p className="sm:col-span-2">Note: <span className="font-medium">{initialData.note ?? "—"}</span></p>
        <div className="sm:col-span-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Nom</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          minLength={2}
          maxLength={100}
          defaultValue={initialData.fullName}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nickname">Surnom</Label>
          <Input
            id="nickname"
            name="nickname"
            maxLength={50}
            defaultValue={initialData.nickname ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            maxLength={20}
            defaultValue={initialData.phone ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          name="note"
          maxLength={500}
          defaultValue={initialData.note ?? ""}
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
          <span className="text-muted-foreground text-xs">(cliquer pour changer)</span>
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsEditing(false);
            setIsActive(initialData.isActive);
            setError(null);
          }}
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
  );
}
