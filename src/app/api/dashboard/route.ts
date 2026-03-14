import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDashboardData } from "@/server/services/dashboardService";

export async function GET() {
  try {
    await requireAuth();

    const data = await getDashboardData();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.error("[api/dashboard][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}