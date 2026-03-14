import type { DailyActivity, KpiComparison, TopClient, Transaction } from "@/types";
import { calcVariation } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

interface DayKpiRange {
  start: Date;
  end: Date;
}

export interface DashboardData {
  comparison: KpiComparison;
  dailyActivity: DailyActivity[];
  topClients: TopClient[];
  recentTransactions: Transaction[];
  newClientsToday: number;
  regularClientsToday: number;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function getDayKpi(range: DayKpiRange) {
  const [aggregate, activeClients] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        transactionDate: {
          gte: range.start,
          lte: range.end,
        },
      },
      _count: { id: true },
      _sum: { amountCfa: true },
      _avg: { amountCfa: true },
    }),
    prisma.transaction.groupBy({
      by: ["clientId"],
      where: {
        transactionDate: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
  ]);

  return {
    transactionCount: aggregate._count.id,
    clientCount: activeClients.length,
    totalVolumeCfa: aggregate._sum.amountCfa ?? 0,
    avgAmountCfa: aggregate._avg.amountCfa ?? 0,
  };
}

async function getDailyActivity(days: number): Promise<DailyActivity[]> {
  const today = startOfDay(new Date());
  const rangeStart = startOfDay(new Date(today));
  rangeStart.setDate(rangeStart.getDate() - (days - 1));

  const transactions = await prisma.transaction.findMany({
    where: {
      transactionDate: {
        gte: rangeStart,
        lte: endOfDay(today),
      },
    },
    select: {
      clientId: true,
      amountCfa: true,
      transactionDate: true,
    },
    orderBy: {
      transactionDate: "asc",
    },
  });

  const buckets = new Map<
    string,
    { transactionCount: number; totalVolumeCfa: number; clients: Set<string> }
  >();

  for (let index = 0; index < days; index += 1) {
    const date = new Date(rangeStart);
    date.setDate(rangeStart.getDate() + index);
    buckets.set(isoDay(date), {
      transactionCount: 0,
      totalVolumeCfa: 0,
      clients: new Set<string>(),
    });
  }

  for (const transaction of transactions) {
    const key = isoDay(new Date(transaction.transactionDate));
    const bucket = buckets.get(key);

    if (!bucket) {
      continue;
    }

    bucket.transactionCount += 1;
    bucket.totalVolumeCfa += transaction.amountCfa;
    bucket.clients.add(transaction.clientId);
  }

  return Array.from(buckets.entries()).map(([date, bucket]) => ({
    date,
    transactionCount: bucket.transactionCount,
    totalVolumeCfa: bucket.totalVolumeCfa,
    clientCount: bucket.clients.size,
  }));
}

async function getTopClients(): Promise<TopClient[]> {
  const groups = await prisma.transaction.groupBy({
    by: ["clientId"],
    _count: { id: true },
    _sum: { amountCfa: true },
    _max: { transactionDate: true },
    orderBy: {
      _sum: {
        amountCfa: "desc",
      },
    },
    take: 5,
  });

  if (groups.length === 0) {
    return [];
  }

  const clients = await prisma.client.findMany({
    where: {
      id: {
        in: groups.map((group) => group.clientId),
      },
    },
    select: {
      id: true,
      fullName: true,
      nickname: true,
    },
  });

  const clientMap = new Map(clients.map((client) => [client.id, client]));

  return groups
    .map((group) => {
      const client = clientMap.get(group.clientId);
      if (!client || !group._max.transactionDate) {
        return null;
      }

      return {
        clientId: group.clientId,
        fullName: client.fullName,
        nickname: client.nickname,
        transactionCount: group._count.id,
        totalVolumeCfa: group._sum.amountCfa ?? 0,
        lastTransactionDate: group._max.transactionDate,
      } satisfies TopClient;
    })
    .filter((client): client is TopClient => client !== null);
}

async function getRecentTransactions(): Promise<Transaction[]> {
  const transactions = await prisma.transaction.findMany({
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
    take: 6,
  });

  return transactions;
}

async function getNewClientsCount(range: DayKpiRange): Promise<number> {
  return prisma.client.count({
    where: {
      createdAt: {
        gte: range.start,
        lte: range.end,
      },
    },
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = startOfDay(yesterday);
  const yesterdayEnd = endOfDay(yesterday);

  // Rolling 7-day windows for week comparison
  const thisWeekStart = new Date(todayStart);
  thisWeekStart.setDate(thisWeekStart.getDate() - 6); // last 7 days including today
  const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);
  const lastWeekStart = new Date(lastWeekEnd);
  lastWeekStart.setDate(lastWeekStart.getDate() - 6);
  lastWeekStart.setHours(0, 0, 0, 0);

  const [
    today,
    yesterdayKpi,
    thisWeekKpi,
    lastWeekKpi,
    newClientsToday,
    dailyActivity,
    topClients,
    recentTransactions,
  ] = await Promise.all([
    getDayKpi({ start: todayStart, end: todayEnd }),
    getDayKpi({ start: yesterdayStart, end: yesterdayEnd }),
    getDayKpi({ start: thisWeekStart, end: todayEnd }),
    getDayKpi({ start: lastWeekStart, end: lastWeekEnd }),
    getNewClientsCount({ start: todayStart, end: todayEnd }),
    getDailyActivity(7),
    getTopClients(),
    getRecentTransactions(),
  ]);

  const regularClientsToday = Math.max(0, today.clientCount - newClientsToday);

  return {
    comparison: {
      today,
      yesterday: yesterdayKpi,
      trends: {
        transactions: calcVariation(today.transactionCount, yesterdayKpi.transactionCount),
        clients: calcVariation(today.clientCount, yesterdayKpi.clientCount),
        volume: calcVariation(today.totalVolumeCfa, yesterdayKpi.totalVolumeCfa),
        transactionsWeek: calcVariation(thisWeekKpi.transactionCount, lastWeekKpi.transactionCount),
        volumeWeek: calcVariation(thisWeekKpi.totalVolumeCfa, lastWeekKpi.totalVolumeCfa),
      },
    },
    dailyActivity,
    topClients,
    recentTransactions,
    newClientsToday,
    regularClientsToday,
  };
}