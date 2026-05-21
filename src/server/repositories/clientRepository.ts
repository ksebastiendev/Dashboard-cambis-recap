import { Prisma } from "@prisma/client";
import type { ClientRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ListClientsParams {
  query?: string;
  limit?: number;
  type?: ClientRole;
}

function buildClientWhere(
  query?: string,
  type?: ClientRole
): Prisma.ClientWhereInput {
  return {
    isDeleted: false,
    ...(query
      ? {
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { nickname: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(type ? { clientTypes: { some: { type } } } : {}),
  };
}

export async function listClients(params: ListClientsParams = {}) {
  const { query, limit = 50, type } = params;

  return prisma.client.findMany({
    where: buildClientWhere(query, type),
    include: { clientTypes: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getClientById(id: string) {
  return prisma.client.findFirst({
    where: { id, isDeleted: false },
    include: { clientTypes: true },
  });
}

export async function deleteClient(id: string) {
  return prisma.client.update({
    where: { id },
    data: { isDeleted: true },
  });
}

export async function createClient(data: {
  fullName: string;
  nickname?: string;
  phone?: string;
  note?: string;
  types?: ClientRole[];
}) {
  return prisma.client.create({
    data: {
      fullName: data.fullName,
      nickname: data.nickname || null,
      phone: data.phone || null,
      note: data.note || null,
      ...(data.types && data.types.length > 0
        ? {
            clientTypes: {
              create: data.types.map((type) => ({ type })),
            },
          }
        : {}),
    },
    include: { clientTypes: true },
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

// ═════════════════════════════════════════
// V2 — Fonctions clients
// ═════════════════════════════════════════

// Retourne les clients filtrés par rôle (DOLLAR_SELLER, DOLLAR_BUYER, NAIRA_BUYER)
export async function getClientsByType(type: ClientRole) {
  return prisma.client.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      clientTypes: { some: { type } },
    },
    include: { clientTypes: true },
    orderBy: { createdAt: "desc" },
  });
}

// Autocomplétion : 5 clients les plus récemment actifs par défaut,
// ou filtrés par nom/téléphone si query est fourni.
export async function searchClients(query?: string, limit = 5) {
  const where: Prisma.ClientWhereInput = {
    isActive: true,
    isDeleted: false,
    ...(query?.trim()
      ? {
          OR: [
            { fullName: { contains: query.trim(), mode: "insensitive" } },
            { phone: { contains: query.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // Récupère les IDs des clients ayant une opération récente pour les trier
  if (!query?.trim()) {
    const recentOps = await prisma.operation.groupBy({
      by: ["clientId"],
      where: { isDeleted: false, clientId: { not: null } },
      _max: { operationDate: true },
      orderBy: { _max: { operationDate: "desc" } },
      take: limit,
    });

    const recentClientIds = recentOps
      .map((op) => op.clientId)
      .filter((id): id is string => id !== null);

    if (recentClientIds.length > 0) {
      const clients = await prisma.client.findMany({
        where: { id: { in: recentClientIds }, isActive: true, isDeleted: false },
        include: { clientTypes: true },
      });
      // Respecte l'ordre des IDs retournés par groupBy
      const byId = new Map(clients.map((c) => [c.id, c]));
      return recentClientIds
        .map((id) => byId.get(id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined);
    }
  }

  return prisma.client.findMany({
    where,
    include: { clientTypes: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// Stats V2 par type d'opération (utilise le modèle Operation)
export async function getClientOperationStats(clientId: string) {
  const [typeA, typeB, typeC] = await Promise.all([
    prisma.operation.aggregate({
      where: { clientId, type: "TYPE_A", isDeleted: false },
      _count: { id: true },
      _sum: { amountUsd: true, totalCfaSpent: true },
    }),
    prisma.operation.aggregate({
      where: { clientId, type: "TYPE_B", isDeleted: false },
      _count: { id: true },
      _sum: { amountUsd: true, totalNgnReceived: true },
    }),
    prisma.operation.aggregate({
      where: { clientId, type: "TYPE_C", isDeleted: false },
      _count: { id: true },
      _sum: { amountNgn: true, totalCfaReceived: true },
      _max: { operationDate: true },
    }),
  ]);

  return {
    typeA: {
      count: typeA._count.id,
      totalUsd: typeA._sum.amountUsd ?? 0,
      totalCfaSpent: typeA._sum.totalCfaSpent ?? 0,
    },
    typeB: {
      count: typeB._count.id,
      totalUsd: typeB._sum.amountUsd ?? 0,
      totalNgnReceived: typeB._sum.totalNgnReceived ?? 0,
    },
    typeC: {
      count: typeC._count.id,
      totalNgn: typeC._sum.amountNgn ?? 0,
      totalCfaReceived: typeC._sum.totalCfaReceived ?? 0,
      lastOperationDate: typeC._max.operationDate ?? null,
    },
    totalOperations:
      typeA._count.id + typeB._count.id + typeC._count.id,
  };
}
