import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listClientsWithStats } from "@/server/services/clientService";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const query = request.nextUrl.searchParams.get("q") ?? undefined;
    const clients = await listClientsWithStats(query);

    return NextResponse.json({ data: clients.slice(0, 10) }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.error("[api/clients/search][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
