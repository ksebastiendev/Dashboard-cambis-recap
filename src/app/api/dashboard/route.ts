import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { requireAuth } from "@/lib/auth";
import { getDashboardKpis, periodBounds } from "@/server/services/dashboardServiceV2";

// Convertit récursivement les Decimal en number pour la sérialisation JSON.
// Les montants CFA/Naira/USD restent dans la plage précise des float64.
function serializeDecimals<T>(value: T): unknown {
  if (value instanceof Decimal) return value.toNumber();
  if (Array.isArray(value)) return value.map(serializeDecimals);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        serializeDecimals(v),
      ])
    );
  }
  return value;
}

// GET /api/dashboard?period=1d|7d|1m|1y|all&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = request.nextUrl;
    const periodParam = searchParams.get("period") ?? "1d";
    const fromParam = searchParams.get("from") ?? undefined;
    const toParam = searchParams.get("to") ?? undefined;

    let dateFrom: Date;
    let dateTo: Date;

    if (periodParam === "custom" && fromParam && toParam) {
      dateFrom = new Date(fromParam);
      dateFrom.setHours(0, 0, 0, 0);
      dateTo = new Date(toParam);
      dateTo.setHours(23, 59, 59, 999);

      if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
        return NextResponse.json(
          { error: "Dates invalides. Format attendu : YYYY-MM-DD" },
          { status: 400 }
        );
      }
    } else {
      const validPeriod =
        periodParam === "1d" ||
        periodParam === "7d" ||
        periodParam === "1m" ||
        periodParam === "1y" ||
        periodParam === "all"
          ? periodParam
          : "1d";
      ({ dateFrom, dateTo } = periodBounds(validPeriod));
    }

    const kpis = await getDashboardKpis(dateFrom, dateTo);

    return NextResponse.json({ data: serializeDecimals(kpis) }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("[api/dashboard][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
