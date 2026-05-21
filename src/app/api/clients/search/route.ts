import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchClients } from "@/server/repositories/clientRepository";

// GET /api/clients/search?q=
// Retourne max 5 clients : les plus récemment actifs par défaut,
// ou filtrés par nom/téléphone si q est fourni.
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const query = request.nextUrl.searchParams.get("q") ?? undefined;
    const clients = await searchClients(query, 5);

    return NextResponse.json({ data: clients }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("[api/clients/search][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
