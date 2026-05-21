import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createOperationSchema } from "@/lib/validations/operation";
import { createOperation, getOperations } from "@/server/repositories/operationRepo";

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// GET /api/operations?type=TYPE_A&clientId=...&dateFrom=...&dateTo=...&cursor=...&limit=20
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    void session;

    const { searchParams } = request.nextUrl;
    const typeParam = searchParams.get("type");
    const type =
      typeParam === "TYPE_A" || typeParam === "TYPE_B" || typeParam === "TYPE_C"
        ? typeParam
        : undefined;

    const result = await getOperations({
      type,
      clientId: searchParams.get("clientId") ?? undefined,
      dateFrom: parseDateParam(searchParams.get("dateFrom")),
      dateTo: parseDateParam(searchParams.get("dateTo")),
      cursor: searchParams.get("cursor") ?? undefined,
      limit: Math.min(100, Number(searchParams.get("limit") ?? "20")),
    });

    return NextResponse.json(
      {
        data: result.items,
        pageInfo: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("[api/operations][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/operations
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const parsed = createOperationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const operation = await createOperation(parsed.data, {
      userId: session.userId,
      email: session.email,
    });

    return NextResponse.json({ data: operation }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("[api/operations][POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
