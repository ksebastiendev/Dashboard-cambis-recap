import type { Metadata } from "next";
import { ArrowRightLeft, Coins, LayoutDashboard, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityChartClient } from "@/components/dashboard/ActivityChartClient";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TopClientsCard } from "@/components/dashboard/TopClientsCard";
import {
  formatCfa,
  formatDateShort,
  formatNumber,
  formatOperationType,
  formatTime,
} from "@/lib/formatters";
import { getDashboardData } from "@/server/services/dashboardService";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de votre activité"
        icon={LayoutDashboard}
        action={
          <Button asChild size="sm">
            <Link href="/transactions/new">
              <Plus className="h-4 w-4" />
              Nouvelle transaction
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Transactions aujourd'hui"
          value={formatNumber(data.comparison.today.transactionCount)}
          subtitle="vs hier"
          trend={data.comparison.trends.transactions}
          weekTrend={data.comparison.trends.transactionsWeek}
          icon={ArrowRightLeft}
        />
        <KpiCard
          title="Clients actifs"
          value={formatNumber(data.comparison.today.clientCount)}
          subtitle="vs hier"
          trend={data.comparison.trends.clients}
          extra={`${data.newClientsToday} nouveau${data.newClientsToday !== 1 ? "x" : ""} · ${data.regularClientsToday} régulier${data.regularClientsToday !== 1 ? "s" : ""}`}
          icon={Users}
        />
        <KpiCard
          title="Volume du jour"
          value={formatCfa(data.comparison.today.totalVolumeCfa)}
          subtitle="vs hier"
          trend={data.comparison.trends.volume}
          weekTrend={data.comparison.trends.volumeWeek}
          icon={Wallet}
        />
        <KpiCard
          title="Ticket moyen"
          value={formatCfa(data.comparison.today.avgAmountCfa)}
          subtitle="Moyenne par transaction"
          trend={null}
          icon={Coins}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityChartClient data={data.dailyActivity} />
        </div>
        <TopClientsCard clients={data.topClients} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune transaction enregistrée pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {data.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border px-3 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{transaction.client?.fullName ?? "Client"}</p>
                      <Badge variant={transaction.operationType === "BUY_NAIRA" ? "success" : "warning"}>
                        {formatOperationType(transaction.operationType)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(transaction.transactionDate)} à {formatTime(transaction.transactionDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCfa(transaction.amountCfa)}</p>
                    <p className="text-xs text-muted-foreground">{transaction.amountNaira.toLocaleString("fr-FR")} NGN</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
