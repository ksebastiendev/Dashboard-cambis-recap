import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ListClientsParams {
  query?: string;
  limit?: number;
}

function buildClientWhere(query?: string): Prisma.ClientWhereInput {
  if (!query) {
    return {};
  }

  return {
    OR: [
      { fullName: { contains: query, mode: "insensitive" } },
      { nickname: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
    ],
  };
}

export async function listClients(params: ListClientsParams = {}) {
  const { query, limit = 50 } = params;

  return prisma.client.findMany({
    where: buildClientWhere(query),
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
  });
}

export async function createClient(data: {
  fullName: string;
  nickname?: string;
  phone?: string;
  note?: string;
}) {
  return prisma.client.create({
    data: {
      fullName: data.fullName,
      nickname: data.nickname || null,
      phone: data.phone || null,
      note: data.note || null,
    },
  });
}

export async function updateClient(
  id: string,
  data: {
    fullName?: string;
    nickname?: string;
    phone?: string;
    note?: string;
    isActive?: boolean;
  }
) {
  return prisma.client.update({
    where: { id },
    data: {
      fullName: data.fullName,
      nickname: data.nickname === undefined ? undefined : data.nickname || null,
      phone: data.phone === undefined ? undefined : data.phone || null,
      note: data.note === undefined ? undefined : data.note || null,
      isActive: data.isActive,
    },
  });
}

export async function getClientTransactions(id: string, limit = 50) {
  return prisma.transaction.findMany({
    where: { clientId: id },
    orderBy: { transactionDate: "desc" },
    take: limit,
  });
}

export async function getClientStats(id: string) {
  const stats = await prisma.transaction.aggregate({
    where: { clientId: id },
    _count: { id: true },
    _sum: { amountCfa: true, amountNaira: true },
    _max: { transactionDate: true },
  });

  return {
    transactionCount: stats._count.id,
    totalVolumeCfa: stats._sum.amountCfa ?? 0,
    totalVolumeNaira: stats._sum.amountNaira ?? 0,
    lastTransactionDate: stats._max.transactionDate,
  };
}

export async function getStatsForClientIds(clientIds: string[]) {
  if (clientIds.length === 0) {
    return [];
  }

  return prisma.transaction.groupBy({
    by: ["clientId"],
    where: { clientId: { in: clientIds } },
    _count: { id: true },
    _sum: { amountCfa: true },
    _max: { transactionDate: true },
  });
}
