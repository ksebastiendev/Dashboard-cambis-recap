import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getClientOperationStats } from "@/server/repositories/clientRepository";
import { prisma } from "@/lib/prisma";

// GET /api/clients/[id]/stats
// Retourne les stats V2 par type d'opération (TYPE_A, TYPE_B, TYPE_C)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    const stats = await getClientOperationStats(id);
    return NextResponse.json({ data: stats }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("[api/clients/:id/stats][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
