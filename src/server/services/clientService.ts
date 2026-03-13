import {
  createClient,
  getClientById,
  getClientStats,
  getClientTransactions,
  getStatsForClientIds,
  listClients,
  updateClient,
} from "@/server/repositories/clientRepository";
import type { CreateClientInput, UpdateClientInput } from "@/lib/validations";

export interface ClientListItem {
  id: string;
  fullName: string;
  nickname: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  transactionCount: number;
  totalVolumeCfa: number;
  lastTransactionDate: Date | null;
}

export async function listClientsWithStats(query?: string): Promise<ClientListItem[]> {
  const clients = await listClients({ query, limit: 100 });
  const stats = await getStatsForClientIds(clients.map((client) => client.id));

  const statsByClientId = new Map(
    stats.map((item) => [
      item.clientId,
      {
        transactionCount: item._count.id,
        totalVolumeCfa: item._sum.amountCfa ?? 0,
        lastTransactionDate: item._max.transactionDate,
      },
    ])
  );

  return clients.map((client) => {
    const clientStats = statsByClientId.get(client.id);

    return {
      id: client.id,
      fullName: client.fullName,
      nickname: client.nickname,
      phone: client.phone,
      isActive: client.isActive,
      createdAt: client.createdAt,
      transactionCount: clientStats?.transactionCount ?? 0,
      totalVolumeCfa: clientStats?.totalVolumeCfa ?? 0,
      lastTransactionDate: clientStats?.lastTransactionDate ?? null,
    };
  });
}

export async function getClientDetail(id: string) {
  const client = await getClientById(id);

  if (!client) {
    return null;
  }

  const [stats, transactions] = await Promise.all([
    getClientStats(id),
    getClientTransactions(id, 100),
  ]);

  return {
    client,
    stats,
    transactions,
  };
}

export async function createClientFromInput(input: CreateClientInput) {
  return createClient({
    fullName: input.fullName,
    nickname: input.nickname || undefined,
    phone: input.phone || undefined,
    note: input.note || undefined,
  });
}

export async function updateClientFromInput(id: string, input: UpdateClientInput) {
  return updateClient(id, {
    fullName: input.fullName,
    nickname: input.nickname,
    phone: input.phone,
    note: input.note,
    isActive: input.isActive,
  });
}
