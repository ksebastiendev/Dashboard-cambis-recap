import { OperationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ListTransactionsParams {
  clientId?: string;
  operationType?: OperationType;
  from?: Date;
  to?: Date;
  limit?: number;
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