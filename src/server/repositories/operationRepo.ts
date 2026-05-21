import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import type {
  CreateOperationInput,
  UpdateOperationTypeA,
  UpdateOperationTypeB,
  UpdateOperationTypeC,
} from "@/lib/validations/operation";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface GetOperationsParams {
  type?: "TYPE_A" | "TYPE_B" | "TYPE_C";
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  cursor?: string;
  limit?: number;
}

export interface GetOperationsResult {
  items: Awaited<ReturnType<typeof prisma.operation.findMany>>;
  nextCursor: string | null;
  hasMore: boolean;
}

type ActorInfo = { userId: string; email: string };

type UpdateOperationPayload =
  | ({ currentType: "TYPE_A" } & UpdateOperationTypeA)
  | ({ currentType: "TYPE_B" } & UpdateOperationTypeB)
  | ({ currentType: "TYPE_C" } & UpdateOperationTypeC);

// ─────────────────────────────────────────
// Calcul des totaux côté serveur
// Jamais acceptés depuis l'extérieur (SPEC règle 5)
// ─────────────────────────────────────────

function computeTotals(data: CreateOperationInput): {
  totalCfaSpent: Decimal | null;
  totalNgnReceived: Decimal | null;
  totalCfaReceived: Decimal | null;
} {
  if (data.type === "TYPE_A") {
    return {
      totalCfaSpent: new Decimal(data.amountUsd).mul(new Decimal(data.rateCfaPerUsd)),
      totalNgnReceived: null,
      totalCfaReceived: null,
    };
  }
  if (data.type === "TYPE_B") {
    return {
      totalCfaSpent: null,
      totalNgnReceived: new Decimal(data.amountUsd).mul(new Decimal(data.rateNgnPerUsd)),
      totalCfaReceived: null,
    };
  }
  // TYPE_C
  return {
    totalCfaSpent: null,
    totalNgnReceived: null,
    totalCfaReceived: new Decimal(data.amountNgn).mul(new Decimal(data.rateCfaPerNgn)),
  };
}

function computeUpdateTotals(payload: UpdateOperationPayload): {
  totalCfaSpent?: Decimal;
  totalNgnReceived?: Decimal;
  totalCfaReceived?: Decimal;
} {
  if (payload.currentType === "TYPE_A") {
    return {
      totalCfaSpent: new Decimal(payload.amountUsd).mul(new Decimal(payload.rateCfaPerUsd)),
    };
  }
  if (payload.currentType === "TYPE_B") {
    return {
      totalNgnReceived: new Decimal(payload.amountUsd).mul(new Decimal(payload.rateNgnPerUsd)),
    };
  }
  return {
    totalCfaReceived: new Decimal(payload.amountNgn).mul(new Decimal(payload.rateCfaPerNgn)),
  };
}

// ─────────────────────────────────────────
// createOperation
// ─────────────────────────────────────────

export async function createOperation(
  data: CreateOperationInput,
  actor: ActorInfo
) {
  const totals = computeTotals(data);

  const baseFields = {
    userId: actor.userId,
    clientId: data.clientId ?? null,
    operationDate: data.operationDate ? new Date(data.operationDate) : new Date(),
    note: data.note || null,
    ...totals,
  };

  if (data.type === "TYPE_A") {
    return prisma.operation.create({
      data: {
        type: "TYPE_A",
        amountUsd: new Decimal(data.amountUsd),
        rateCfaPerUsd: new Decimal(data.rateCfaPerUsd),
        ...baseFields,
      },
      include: { client: { select: { id: true, fullName: true } } },
    });
  }

  if (data.type === "TYPE_B") {
    return prisma.operation.create({
      data: {
        type: "TYPE_B",
        amountUsd: new Decimal(data.amountUsd),
        rateNgnPerUsd: new Decimal(data.rateNgnPerUsd),
        ...baseFields,
      },
      include: { client: { select: { id: true, fullName: true } } },
    });
  }

  // TYPE_C
  return prisma.operation.create({
    data: {
      type: "TYPE_C",
      amountNgn: new Decimal(data.amountNgn),
      rateCfaPerNgn: new Decimal(data.rateCfaPerNgn),
      ...baseFields,
    },
    include: { client: { select: { id: true, fullName: true } } },
  });
}

// ─────────────────────────────────────────
// getOperations — liste paginée par cursor
// ─────────────────────────────────────────

export async function getOperations(
  params: GetOperationsParams = {}
): Promise<GetOperationsResult> {
  const { type, clientId, dateFrom, dateTo, cursor, limit = 20 } = params;
  const take = Math.max(1, Math.min(100, limit));

  const items = await prisma.operation.findMany({
    where: {
      isDeleted: false,
      ...(type && { type }),
      ...(clientId && { clientId }),
      ...(dateFrom || dateTo
        ? {
            operationDate: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    },
    include: {
      client: {
        select: { id: true, fullName: true, phone: true },
      },
    },
    orderBy: [{ operationDate: "desc" }, { id: "desc" }],
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: take + 1,
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  return { items: page, nextCursor, hasMore };
}

// ─────────────────────────────────────────
// getOperationById — avec client inclus
// ─────────────────────────────────────────

export async function getOperationById(id: string) {
  return prisma.operation.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, fullName: true, phone: true } },
    },
  });
}

// ─────────────────────────────────────────
// softDeleteOperation — isDeleted=true + audit
// ─────────────────────────────────────────

export async function softDeleteOperation(id: string, actor: ActorInfo) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.operation.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new Error("OPERATION_NOT_FOUND");
    }

    const deleted = await tx.operation.update({
      where: { id },
      data: { isDeleted: true },
    });

    await tx.operationAudit.create({
      data: {
        action: "DELETE",
        snapshot: existing as object,
        operationId: id,
        userId: actor.userId,
      },
    });

    return deleted;
  });
}

// ─────────────────────────────────────────
// updateOperation — snapshot avant update + audit
// ─────────────────────────────────────────

export async function updateOperation(
  id: string,
  payload: UpdateOperationPayload,
  actor: ActorInfo
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.operation.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new Error("OPERATION_NOT_FOUND");
    }
    if (existing.type !== payload.currentType) {
      throw new Error("OPERATION_TYPE_MISMATCH");
    }

    const totals = computeUpdateTotals(payload);

    const updateData: Record<string, unknown> = {
      clientId: payload.clientId ?? null,
      note: payload.note || null,
      ...totals,
    };

    if (payload.operationDate) {
      updateData.operationDate = new Date(payload.operationDate);
    }

    if (payload.currentType === "TYPE_A") {
      const p = payload as UpdateOperationTypeA & { currentType: "TYPE_A" };
      updateData.amountUsd = new Decimal(p.amountUsd);
      updateData.rateCfaPerUsd = new Decimal(p.rateCfaPerUsd);
    } else if (payload.currentType === "TYPE_B") {
      const p = payload as UpdateOperationTypeB & { currentType: "TYPE_B" };
      updateData.amountUsd = new Decimal(p.amountUsd);
      updateData.rateNgnPerUsd = new Decimal(p.rateNgnPerUsd);
    } else {
      const p = payload as UpdateOperationTypeC & { currentType: "TYPE_C" };
      updateData.amountNgn = new Decimal(p.amountNgn);
      updateData.rateCfaPerNgn = new Decimal(p.rateCfaPerNgn);
    }

    await tx.operationAudit.create({
      data: {
        action: "UPDATE",
        snapshot: existing as object,
        operationId: id,
        userId: actor.userId,
      },
    });

    return tx.operation.update({
      where: { id },
      data: updateData,
      include: { client: { select: { id: true, fullName: true } } },
    });
  });
}
