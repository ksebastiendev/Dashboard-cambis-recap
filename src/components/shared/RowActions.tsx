"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RowActionsProps {
  onEdit?: () => void;
  editLoading?: boolean;
  editHref?: string;
  onDelete: () => Promise<void>;
  confirmMessage?: string;
}

export function RowActions({
  onEdit,
  editLoading,
  editHref,
  onDelete,
  confirmMessage = "Cette action est irréversible.",
}: RowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await onDelete();
      setDeleteOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label="Actions"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors outline-none"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[148px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg py-1"
          >
            {editHref ? (
              <DropdownMenu.Item asChild>
                <Link
                  href={editHref}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 cursor-pointer outline-none select-none"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Link>
              </DropdownMenu.Item>
            ) : onEdit ? (
              <DropdownMenu.Item
                onSelect={onEdit}
                disabled={editLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 cursor-pointer outline-none select-none disabled:opacity-50"
              >
                {editLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Pencil className="h-3.5 w-3.5" />
                )}
                Modifier
              </DropdownMenu.Item>
            ) : null}

            <DropdownMenu.Separator className="my-1 h-px bg-zinc-100" />

            <DropdownMenu.Item
              onSelect={() => setDeleteOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none select-none"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => { if (!loading) setDeleteOpen(o); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600 mt-1">{confirmMessage}</p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Suppression...</>
              ) : (
                "Supprimer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
