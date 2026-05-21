import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calcProfit, calcMinRate } from "@/lib/formulas";

// ─────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────

export interface DashboardKpis {
  // Bloc A — Achats de dollars (CFA → $)
  totalUsdBought: Decimal;
  avgRateCfaPerUsd: Decimal;
  totalCfaSpent: Decimal;
  countTypeA: number;

  // Bloc B — Conversion $ → ₦
  totalUsdSold: Decimal;
  avgRateNgnPerUsd: Decimal;
  totalNgnReceived: Decimal;
  countTypeB: number;

  // Bloc C — Ventes ₦ → CFA (opération principale)
  totalNgnSold: Decimal;
  avgRateCfaPerNgn: Decimal;
  totalCfaReceived: Decimal;
  countTypeC: number;

  // Bénéfice — recette (TYPE_C) moins coût (TYPE_A)
  beneficeNet: Decimal;
  marginePct: Decimal;

  // Stock indicatif — calculé sur TOUTE la durée (pas filtré par période)
  stockUsd: Decimal;
  stockNgn: Decimal;

  // Activité clients sur la période
  nbOperationsTypeC: number;
  nbDistinctClients: number;
  nbNewClients: number;

  // Données graphes
  dailyStats: Array<{
    date: string;       // "YYYY-MM-DD"
    benefice: number;
    volumeCfa: number;
    countOps: number;
  }>;

  // Top 5 clients TYPE_C par volume CFA encaissé
  topClients: Array<{
    clientId: string;
    fullName: string;
    totalCfaReceived: number;
    nbOps: number;
  }>;

  // Taux de vente minimum suggéré (null si données insuffisantes)
  tauxMinCfaPerNgn: Decimal | null;
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function toDecimal(value: Decimal | null | undefined): Decimal {
  if (!value) return new Decimal(0);
  return new Decimal(value.toString());
}

function safeDiv(numerator: Decimal, denominator: Decimal): Decimal {
  if (denominator.isZero()) return new Decimal(0);
  return numerator.div(denominator);
}

// ─────────────────────────────────────────
// getDashboardKpis
// ─────────────────────────────────────────

export async function getDashboardKpis(
  dateFrom: Date,
  dateTo: Date
): Promise<DashboardKpis> {
  const periodFilter = {
    isDeleted: false,
    operationDate: { gte: dateFrom, lte: dateTo },
  } as const;

  // ── Aggrégats par type sur la période ──────────────────────────────
  const [aggA, aggB, aggC, allTimeA, allTimeB] = await Promise.all([
    prisma.operation.aggregate({
      where: { ...periodFilter, type: "TYPE_A" },
      _count: { id: true },
      _sum: { amountUsd: true, totalCfaSpent: true },
    }),
    prisma.operation.aggregate({
      where: { ...periodFilter, type: "TYPE_B" },
      _count: { id: true },
      _sum: { amountUsd: true, totalNgnReceived: true },
    }),
    prisma.operation.aggregate({
      where: { ...periodFilter, type: "TYPE_C" },
      _count: { id: true },
      _sum: { amountNgn: true, totalCfaReceived: true },
    }),
    // Stock TYPE_A — tout le temps
    prisma.operation.aggregate({
      where: { type: "TYPE_A", isDeleted: false },
      _sum: { amountUsd: true },
    }),
    // Stock TYPE_B — tout le temps
    prisma.operation.aggregate({
      where: { type: "TYPE_B", isDeleted: false },
      _sum: { amountUsd: true, totalNgnReceived: true },
    }),
  ]);

  // Stock TYPE_C all-time (pour stock ₦ restant)
  const allTimeC = await prisma.operation.aggregate({
    where: { type: "TYPE_C", isDeleted: false },
    _sum: { amountNgn: true },
  });

  // ── KPIs bloc A ────────────────────────────────────────────────────
  const totalUsdBought = toDecimal(aggA._sum.amountUsd);
  const totalCfaSpent = toDecimal(aggA._sum.totalCfaSpent);
  const avgRateCfaPerUsd = safeDiv(totalCfaSpent, totalUsdBought);

  // ── KPIs bloc B ────────────────────────────────────────────────────
  const totalUsdSold = toDecimal(aggB._sum.amountUsd);
  const totalNgnReceived = toDecimal(aggB._sum.totalNgnReceived);
  const avgRateNgnPerUsd = safeDiv(totalNgnReceived, totalUsdSold);

  // ── KPIs bloc C ────────────────────────────────────────────────────
  const totalNgnSold = toDecimal(aggC._sum.amountNgn);
  const totalCfaReceived = toDecimal(aggC._sum.totalCfaReceived);
  const avgRateCfaPerNgn = safeDiv(totalCfaReceived, totalNgnSold);

  // ── Bénéfice ───────────────────────────────────────────────────────
  const { profit: beneficeNet, marginPct: marginePct } = calcProfit(
    totalCfaSpent,
    totalCfaReceived
  );

  // ── Stock indicatif (toute la durée) ──────────────────────────────
  const stockUsd = toDecimal(allTimeA._sum.amountUsd).sub(
    toDecimal(allTimeB._sum.amountUsd)
  );
  const stockNgn = toDecimal(allTimeB._sum.totalNgnReceived).sub(
    toDecimal(allTimeC._sum.amountNgn)
  );

  // ── Taux minimum suggéré ──────────────────────────────────────────
  const tauxMinCfaPerNgn =
    avgRateCfaPerUsd.isZero() || avgRateNgnPerUsd.isZero()
      ? null
      : calcMinRate(avgRateCfaPerUsd, avgRateNgnPerUsd);

  // ── Activité clients ──────────────────────────────────────────────
  const [distinctClientGroups, nbNewClients] = await Promise.all([
    prisma.operation.groupBy({
      by: ["clientId"],
      where: { ...periodFilter, clientId: { not: null } },
    }),
    prisma.client.count({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
    }),
  ]);

  // ── Statistiques journalières (raw SQL pour DATE_TRUNC) ───────────
  type DailyRow = {
    date: Date;
    benefice: unknown;
    volume_cfa: unknown;
    count_ops: unknown;
  };

  const rawDaily = await prisma.$queryRaw<DailyRow[]>`
    SELECT
      DATE_TRUNC('day', "operationDate") AS date,
      COALESCE(SUM(CASE WHEN type = 'TYPE_C' THEN "totalCfaReceived" ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN type = 'TYPE_A' THEN "totalCfaSpent" ELSE 0 END), 0)
        AS benefice,
      COALESCE(SUM(CASE WHEN type = 'TYPE_A' THEN "totalCfaSpent" ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN type = 'TYPE_C' THEN "totalCfaReceived" ELSE 0 END), 0)
        AS volume_cfa,
      COUNT(*) AS count_ops
    FROM operations
    WHERE "isDeleted" = false
      AND "operationDate" >= ${Prisma.raw(`'${dateFrom.toISOString()}'`)}
      AND "operationDate" <= ${Prisma.raw(`'${dateTo.toISOString()}'`)}
    GROUP BY DATE_TRUNC('day', "operationDate")
    ORDER BY date ASC
  `;

  const dailyStats = rawDaily.map((row) => ({
    date: (row.date as Date).toISOString().slice(0, 10),
    benefice: Number(row.benefice),
    volumeCfa: Number(row.volume_cfa),
    countOps: Number(row.count_ops),
  }));

  // ── Top clients TYPE_C ────────────────────────────────────────────
  const topGroups = await prisma.operation.groupBy({
    by: ["clientId"],
    where: { ...periodFilter, type: "TYPE_C", clientId: { not: null } },
    _sum: { totalCfaReceived: true },
    _count: { id: true },
    orderBy: { _sum: { totalCfaReceived: "desc" } },
    take: 5,
  });

  const topClientIds = topGroups
    .map((g) => g.clientId)
    .filter((id): id is string => id !== null);

  const topClientRecords = await prisma.client.findMany({
    where: { id: { in: topClientIds } },
    select: { id: true, fullName: true },
  });

  const clientNameById = new Map(topClientRecords.map((c) => [c.id, c.fullName]));

  const topClients = topGroups
    .map((g) => ({
      clientId: g.clientId as string,
      fullName: clientNameById.get(g.clientId as string) ?? "Client inconnu",
      totalCfaReceived: Number(toDecimal(g._sum.totalCfaReceived)),
      nbOps: g._count.id,
    }))
    .filter((c) => c.clientId);

  return {
    totalUsdBought,
    avgRateCfaPerUsd,
    totalCfaSpent,
    countTypeA: aggA._count.id,

    totalUsdSold,
    avgRateNgnPerUsd,
    totalNgnReceived,
    countTypeB: aggB._count.id,

    totalNgnSold,
    avgRateCfaPerNgn,
    totalCfaReceived,
    countTypeC: aggC._count.id,

    beneficeNet,
    marginePct,

    stockUsd,
    stockNgn,

    nbOperationsTypeC: aggC._count.id,
    nbDistinctClients: distinctClientGroups.length,
    nbNewClients,

    dailyStats,
    topClients,
    tauxMinCfaPerNgn,
  };
}

// ─────────────────────────────────────────
// Helpers de période — exportés pour la page dashboard
// ─────────────────────────────────────────

export function periodBounds(
  period: "1d" | "7d" | "1m" | "1y" | "all",
  customFrom?: string,
  customTo?: string
): { dateFrom: Date; dateTo: Date } {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (period === "all") {
    return { dateFrom: new Date(0), dateTo: endOfToday };
  }

  if (period === "1d") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { dateFrom: start, dateTo: endOfToday };
  }

  const days = period === "7d" ? 7 : period === "1m" ? 30 : 365;
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { dateFrom: start, dateTo: endOfToday };
}
