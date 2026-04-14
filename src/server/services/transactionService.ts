import { OperationType } from "@prisma/client";
import type { CreateTransactionInput, UpdateTransactionInput } from "@/lib/validations";
import { getClientById, listClients } from "@/server/repositories/clientRepository";
import {
  createTransactionAudit,
  createTransaction,
  deleteTransactionById,
  getTransactionById,
  getTransactionByIdWithSnapshot,
  listTransactions,
  listTransactionsCursor,
  updateTransactionById,
  type ListTransactionsParams,
} from "@/server/repositories/transactionRepository";

export interface TransactionFilters {
  clientId?: string;
  operationType?: OperationType;
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface TransactionCursorFilters extends TransactionFilters {
  cursor?: string;
}

export interface TransactionAuditActor {
  userId?: string;
  email?: string;
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

export async function listTransactionsPage(filters: TransactionCursorFilters = {}) {
  return listTransactionsCursor({
    clientId: filters.clientId,
    operationType: filters.operationType,
    from: filters.from,
    to: filters.to,
    limit: filters.limit ?? 20,
    cursor: filters.cursor,
  });
}

export async function deleteTransaction(id: string, actor?: TransactionAuditActor) {
  const existing = await getTransactionByIdWithSnapshot(id);

  if (!existing) {
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  await createTransactionAudit({
    transactionId: id,
    action: "DELETE",
    actorUserId: actor?.userId,
    actorEmail: actor?.email,
    snapshot: {
      before: existing,
    },
  });

  await deleteTransactionById(id);
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
  actor?: TransactionAuditActor
) {
  const existing = await getTransactionByIdWithSnapshot(id);

  if (!existing) {
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  const updated = await updateTransactionById(id, {
    operationType: input.operationType,
    amountCfa: input.amountCfa,
    amountNaira: input.amountNaira,
    exchangeRate: input.exchangeRate,
    note: input.note || undefined,
  });

  await createTransactionAudit({
    transactionId: id,
    action: "UPDATE",
    actorUserId: actor?.userId,
    actorEmail: actor?.email,
    snapshot: {
      before: existing,
      after: {
        id: updated.id,
        clientId: updated.clientId,
        operationType: updated.operationType,
        amountCfa: updated.amountCfa,
        amountNaira: updated.amountNaira,
        exchangeRate: updated.exchangeRate,
        note: updated.note,
        transactionDate: updated.transactionDate,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    },
  });

  return updated;
}

export async function listClientChoices() {
  const clients = await listClients({ limit: 200 });

  return clients.map((client) => ({
    id: client.id,
    fullName: client.fullName,
    nickname: client.nickname,
    phone: client.phone,
  }));
}