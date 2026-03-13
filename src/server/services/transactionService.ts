import { OperationType } from "@prisma/client";
import type { CreateTransactionInput } from "@/lib/validations";
import { getClientById, listClients } from "@/server/repositories/clientRepository";
import {
  createTransaction,
  listTransactions,
  type ListTransactionsParams,
} from "@/server/repositories/transactionRepository";

export interface TransactionFilters {
  clientId?: string;
  operationType?: OperationType;
  from?: Date;
  to?: Date;
  limit?: number;
}

export async function createTransactionFromInput(input: CreateTransactionInput) {
  const client = await getClientById(input.clientId);

  if (!client) {
    throw new Error("CLIENT_NOT_FOUND");
  }

  return createTransaction({
    clientId: input.clientId,
    operationType: input.operationType,
    amountCfa: input.amountCfa,
    amountNaira: input.amountNaira,
    exchangeRate: input.exchangeRate,
    note: input.note || undefined,
  });
}

export async function listTransactionsWithClient(filters: TransactionFilters = {}) {
  const params: ListTransactionsParams = {
    clientId: filters.clientId,
    operationType: filters.operationType,
    from: filters.from,
    to: filters.to,
    limit: filters.limit ?? 200,
  };

  return listTransactions(params);
}

export async function listClientChoices() {
  const clients = await listClients({ limit: 200 });

  return clients.map((client) => ({
    id: client.id,
    fullName: client.fullName,
    nickname: client.nickname,
  }));
}