import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createTransactionSchema } from "@/lib/validations";
import {
  createTransactionFromInput,
  listTransactionsPage,
} from "@/server/services/transactionService";

function parseDateStart(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDateEnd(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setHours(23, 59, 59, 999);
  return date;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const clientId = request.nextUrl.searchParams.get("clientId") ?? undefined;
    const operationType = request.nextUrl.searchParams.get("operationType");
    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    const from = parseDateStart(request.nextUrl.searchParams.get("from"));
    const to = parseDateEnd(request.nextUrl.searchParams.get("to"));
    const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(100, Math.trunc(limitRaw)))
      : 20;

    const transactions = await listTransactionsPage({
      clientId,
      operationType:
        operationType === "BUY_NAIRA" || operationType === "SELL_NAIRA"
          ? operationType
          : undefined,
      from,
      to,
      limit,
      cursor,
    });

    return NextResponse.json(
      {
        data: transactions.items,
        pageInfo: {
          nextCursor: transactions.nextCursor,
          hasMore: transactions.hasMore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.error("[api/transactions][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const transaction = await createTransactionFromInput(parsed.data);
    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "CLIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    console.error("[api/transactions][POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}