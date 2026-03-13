import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClientSchema } from "@/lib/validations";
import {
  createClientFromInput,
  listClientsWithStats,
} from "@/server/services/clientService";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const query = request.nextUrl.searchParams.get("q") ?? undefined;
    const clients = await listClientsWithStats(query);

    return NextResponse.json({ data: clients }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.error("[api/clients][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const client = await createClientFromInput(parsed.data);
    return NextResponse.json({ data: client }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.error("[api/clients][POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
