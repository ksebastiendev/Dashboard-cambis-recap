import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/operations/count  — nombre d'opérations du jour
export async function GET() {
  try {
    await requireAuth();

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const count = await prisma.operation.count({
      where: {
        isDeleted: false,
        operationDate: { gte: start, lte: end },
      },
    });

    return NextResponse.json({ count }, { status: 200 });
  } catch {
    // En cas d'erreur on renvoie 0 pour ne pas bloquer le nav
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
