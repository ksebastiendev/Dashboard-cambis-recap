import { OperationType, Prisma, TransactionAuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ListTransactionsParams {
  clientId?: string;
  operationType?: OperationType;
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface CursorTransactionsParams extends ListTransactionsParams {
  cursor?: string;
}

export interface CursorTransactionsResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function createTransaction(data: {
  clientId: string;
  operationType: OperationType;
  amountCfa: number;
  amountNaira: number;
  exchangeRate: number;
  note?: string;
}) {
  return prisma.transaction.create({
    data: {
      clientId: data.clientId,
      operationType: data.operationType,
      amountCfa: data.amountCfa,
      amountNaira: data.amountNaira,
      exchangeRate: data.exchangeRate,
      note: data.note || null,
    },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          nickname: true,
        },
      },
    },
  });
}

export async function listTransactions(params: ListTransactionsParams = {}) {
  const { clientId, operationType, from, to, limit = 200 } = params;

  return prisma.transaction.findMany({
    where: {
      clientId,
      operationType,
      transactionDate:
        from || to
          ? {
              gte: from,
              lte: to,
            }
          : undefined,
    },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          nickname: true,
        },
      },
    },
    orderBy: {
      transactionDate: "desc",
    },
    take: limit,
  });
}

export async function listTransactionsCursor(
  params: CursorTransactionsParams = {}
): Promise<CursorTransactionsResult<Awaited<ReturnType<typeof prisma.transaction.findMany>>[number]>> {
  const { clientId, operationType, from, to, limit = 20, cursor } = params;

  const rows = await prisma.transaction.findMany({
    where: {
      clientId,
      operationType,
      transactionDate:
        from || to
          ? {
              gte: from,
              lte: to,
            }
          : undefined,
    },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          nickname: true,
          phone: true,
        },
      },
    },
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: Math.max(1, Math.min(100, limit)) + 1,
  });

  const hasMore = rows.length > Math.max(1, Math.min(100, limit));
  const items = hasMore ? rows.slice(0, -1) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return {
    items,
    hasMore,
    nextCursor,
  };
}

export async function getTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    select: { id: true },
  });
}

export async function getTransactionByIdWithSnapshot(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    select: {
      id: true,
      clientId: true,
      operationType: true,
      amountCfa: true,
      amountNaira: true,
      exchangeRate: true,
      note: true,
      transactionDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteTransactionById(id: string) {
  return prisma.transaction.delete({
    where: { id },
  });
}

export async function updateTransactionById(
  id: string,
  data: {
    operationType: OperationType;
    amountCfa: number;
    amountNaira: number;
    exchangeRate: number;
    note?: string;
  }
) {
  return prisma.transaction.update({
    where: { id },
    data: {
      operationType: data.operationType,
      amountCfa: data.amountCfa,
      amountNaira: data.amountNaira,
      exchangeRate: data.exchangeRate,
      note: data.note || null,
    },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          nickname: true,
          phone: true,
        },
      },
    },
  });
}

export async function createTransactionAudit(data: {
  transactionId: string;
  action: TransactionAuditAction;
  actorUserId?: string;
  actorEmail?: string;
  snapshot?: Prisma.InputJsonValue;
}) {
  return prisma.transactionAudit.create({
    data: {
      transactionId: data.transactionId,
      action: data.action,
      actorUserId: data.actorUserId || null,
      actorEmail: data.actorEmail || null,
      snapshot: data.snapshot,
    },
  });
}