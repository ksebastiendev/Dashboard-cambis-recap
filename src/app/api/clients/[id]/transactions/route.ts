import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getClientDetail } from "@/server/services/clientService";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const detail = await getClientDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    return NextResponse.json({ data: detail.transactions }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.error("[api/clients/:id/transactions][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
