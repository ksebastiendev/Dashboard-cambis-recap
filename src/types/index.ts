// Types globaux — Dashboard Cambiste V1

// ─────────────────────────────────────────
// Métier
// ─────────────────────────────────────────

export type OperationType = "BUY_NAIRA" | "SELL_NAIRA";

export interface Client {
  id: string;
  fullName: string;
  nickname: string | null;
  phone: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Stats calculées (optionnelles selon le contexte)
  _count?: {
    transactions: number;
  };
}

export interface Transaction {
  id: string;
  clientId: string;
  operationType: OperationType;
  amountCfa: number;
  amountNaira: number;
  exchangeRate: number;
  note: string | null;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
  client?: Pick<Client, "id" | "fullName" | "nickname">;
}

// ─────────────────────────────────────────
// Dashboard / KPI
// ─────────────────────────────────────────

export interface DayKpi {
  transactionCount: number;
  clientCount: number;
  totalVolumeCfa: number;
  avgAmountCfa: number;
}

export interface KpiComparison {
  today: DayKpi;
  yesterday: DayKpi;
  trends: {
    transactions: number | null; // % variation, null si pas de données hier
    clients: number | null;
    volume: number | null;
  };
}

export interface DailyActivity {
  date: string; // ISO date string
  transactionCount: number;
  totalVolumeCfa: number;
  clientCount: number;
}

export interface TopClient {
  clientId: string;
  fullName: string;
  nickname: string | null;
  transactionCount: number;
  totalVolumeCfa: number;
  lastTransactionDate: Date;
}

// ─────────────────────────────────────────
// API
// ─────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: string;
  details?: unknown;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ─────────────────────────────────────────
// Formulaires
// ─────────────────────────────────────────

export interface CreateTransactionInput {
  clientId: string;
  operationType: OperationType;
  amountCfa: number;
  amountNaira: number;
  exchangeRate: number;
  note?: string;
}

export interface CreateClientInput {
  fullName: string;
  nickname?: string;
  phone?: string;
  note?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  isActive?: boolean;
}
