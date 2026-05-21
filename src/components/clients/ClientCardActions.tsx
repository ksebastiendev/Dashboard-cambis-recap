"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RowActions } from "@/components/shared/RowActions";
import { EditClientModal } from "@/components/clients/EditClientModal";

interface ClientData {
  fullName: string;
  nickname: string | null;
  phone: string | null;
  note: string | null;
  isActive: boolean;
}

export function ClientCardActions({
  id,
  name,
  initialData,
}: {
  id: string;
  name: string;
  initialData: Omit<ClientData, "note">;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const handleEdit = async () => {
    setLoadingEdit(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const json = await res.json();
        const c = json.data?.client ?? json;
        setClientData({
          fullName: c.fullName,
          nickname: c.nickname ?? null,
          phone: c.phone ?? null,
          note: c.note ?? null,
          isActive: c.isActive,
        });
      } else {
        setClientData({ ...initialData, note: null });
      }
    } catch {
      setClientData({ ...initialData, note: null });
    } finally {
      setLoadingEdit(false);
      setEditOpen(true);
    }
  };

  return (
    <>
      <RowActions
        onEdit={handleEdit}
        editLoading={loadingEdit}
        onDelete={async () => {
          const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error ?? "Impossible de supprimer ce client");
          }
          router.refresh();
        }}
        confirmMessage={`Le client "${name}" sera définitivement supprimé.`}
      />

      {clientData && (
        <EditClientModal
          open={editOpen}
          onOpenChange={setEditOpen}
          id={id}
          initialData={clientData}
        />
      )}
    </>
  );
}
