import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  updateOperationTypeASchema,
  updateOperationTypeBSchema,
  updateOperationTypeCSchema,
} from "@/lib/validations/operation";
import {
  getOperationById,
  softDeleteOperation,
  updateOperation,
} from "@/server/repositories/operationRepo";

// DELETE /api/operations/[id]  — soft delete + audit
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await softDeleteOperation(id, { userId: session.userId, email: session.email });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "OPERATION_NOT_FOUND") {
      return NextResponse.json({ error: "Opération introuvable" }, { status: 404 });
    }
    console.error("[api/operations/:id][DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/operations/[id]  — mise à jour + audit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Récupère le type actuel pour sélectionner le bon schema Zod
    const existing = await getOperationById(id);
    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: "Opération introuvable" }, { status: 404 });
    }

    const body = await request.json();

    // Sélection du schema selon le type stocké en DB
    const schemaMap = {
      TYPE_A: updateOperationTypeASchema,
      TYPE_B: updateOperationTypeBSchema,
      TYPE_C: updateOperationTypeCSchema,
    } as const;

    const schema = schemaMap[existing.type];
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateOperation(
      id,
      { currentType: existing.type, ...parsed.data } as Parameters<typeof updateOperation>[1],
      { userId: session.userId, email: session.email }
    );

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (
      error instanceof Error &&
      (error.message === "OPERATION_NOT_FOUND" ||
        error.message === "OPERATION_TYPE_MISMATCH")
    ) {
      return NextResponse.json({ error: "Opération introuvable" }, { status: 404 });
    }
    console.error("[api/operations/:id][PATCH]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
