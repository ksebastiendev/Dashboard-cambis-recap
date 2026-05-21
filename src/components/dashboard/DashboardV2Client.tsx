"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  ComposedChart,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Package, DollarSign, ArrowRightLeft, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatCfa,
  formatNaira,
  formatNumber,
} from "@/lib/formatters";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type Period = "1d" | "7d" | "1m" | "1y" | "all";

interface DashboardData {
  totalUsdBought: number;
  avgRateCfaPerUsd: number;
  totalCfaSpent: number;
  countTypeA: number;
  totalUsdSold: number;
  avgRateNgnPerUsd: number;
  totalNgnReceived: number;
  countTypeB: number;
  totalNgnSold: number;
  avgRateCfaPerNgn: number;
  totalCfaReceived: number;
  countTypeC: number;
  beneficeNet: number;
  marginePct: number;
  stockUsd: number;
  stockNgn: number;
  nbOperationsTypeC: number;
  nbDistinctClients: number;
  nbNewClients: number;
  dailyStats: Array<{
    date: string;
    benefice: number;
    volumeCfa: number;
    countOps: number;
  }>;
  topClients: Array<{
    clientId: string;
    fullName: string;
    totalCfaReceived: number;
    nbOps: number;
  }>;
  tauxMinCfaPerNgn: number | null;
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function fmt$(amount: number) {
  return `$ ${formatNumber(amount)}`;
}

function fmtRate(rate: number, decimals = 2) {
  return rate.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(pct: number) {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)} %`;
}

const PERIOD_LABELS: Record<Period, string> = {
  "1d": "Aujourd'hui",
  "7d": "7 jours",
  "1m": "30 jours",
  "1y": "1 an",
  all: "Tout",
};

// ─────────────────────────────────────────
// Small stat row inside a bloc card
// ─────────────────────────────────────────

function StatRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-zinc-100 last:border-0">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-zinc-800 text-right">
        {value}
        {sub && (
          <span className="ml-1 text-xs font-normal text-zinc-400">
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────
// Profit badge
// ─────────────────────────────────────────

function ProfitIndicator({ value }: { value: number }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        isPositive ? "text-emerald-600" : isNeutral ? "text-zinc-400" : "text-red-600"
      )}
    >
      <Icon className="h-4 w-4" />
      {fmtPct(value)}
    </span>
  );
}

// ─────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────
// Chart
// ─────────────────────────────────────────

function DailyChart({
  data,
}: {
  data: DashboardData["dailyStats"];
}) {
  const chartData = data.map((d) => ({
    ...d,
    shortDate: new Date(d.date + "T12:00:00").toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    }),
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-zinc-400">
        Pas de données pour cette période
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey="shortDate"
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickFormatter={(v) =>
              v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
            }
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickFormatter={(v) =>
              v >= 1000000
                ? `${(v / 1000000).toFixed(1)}M`
                : v >= 1000
                ? `${Math.round(v / 1000)}k`
                : String(v)
            }
          />
          <Tooltip
            cursor={{ fill: "hsla(var(--primary), 0.06)" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
              fontSize: 12,
            }}
            formatter={(value, name) => {
              const n = Number(value);
              if (name === "Bénéfice") return [formatCfa(n), name];
              if (name === "Volume") return [formatCfa(n), name];
              return [n, name];
            }}
          />
          <Bar
            yAxisId="right"
            dataKey="volumeCfa"
            name="Volume"
            fill="hsl(var(--primary) / 0.2)"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="benefice"
            name="Bénéfice"
            stroke="hsl(142 71% 45%)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export function DashboardV2Client() {
  const [period, setPeriod] = useState<Period>("1d");

  const { data, isPending, isError } = useQuery<{ data: DashboardData }>({
    queryKey: ["dashboard", period],
    queryFn: () =>
      fetch(`/api/dashboard?period=${period}`).then((r) => r.json()),
    staleTime: 30_000,
  });

  const kpis = data?.data;

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              period === p
                ? "bg-primary text-white"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {isPending && <DashboardSkeleton />}

      {isError && (
        <p className="text-sm text-destructive">
          Erreur lors du chargement des données.
        </p>
      )}

      {kpis && (
        <>
          {/* 3 operation blocs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* TYPE_A */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Achat dollars</span>
                  <span className="text-xs font-normal text-zinc-400">
                    {kpis.countTypeA} op.
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold tabular-nums mb-3">
                  {fmt$(kpis.totalUsdBought)}
                </p>
                <StatRow
                  label="CFA dépensé"
                  value={formatCfa(kpis.totalCfaSpent)}
                />
                <StatRow
                  label="Taux moyen"
                  value={fmtRate(kpis.avgRateCfaPerUsd, 0)}
                  sub="CFA/$"
                />
              </CardContent>
            </Card>

            {/* TYPE_B */}
            <Card className="border-l-4 border-l-foreground/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><ArrowRightLeft className="h-3.5 w-3.5" /> Vente $ → ₦</span>
                  <span className="text-xs font-normal text-zinc-400">
                    {kpis.countTypeB} op.
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold tabular-nums mb-3">
                  {fmt$(kpis.totalUsdSold)}
                </p>
                <StatRow
                  label="Naira reçu"
                  value={formatNaira(kpis.totalNgnReceived)}
                />
                <StatRow
                  label="Taux moyen"
                  value={fmtRate(kpis.avgRateNgnPerUsd, 0)}
                  sub="₦/$"
                />
              </CardContent>
            </Card>

            {/* TYPE_C */}
            <Card className="border-l-4 border-l-foreground/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Vente ₦ → CFA</span>
                  <span className="text-xs font-normal text-zinc-400">
                    {kpis.countTypeC} op.
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold tabular-nums mb-3">
                  {formatNaira(kpis.totalNgnSold)}
                </p>
                <StatRow
                  label="CFA reçu"
                  value={formatCfa(kpis.totalCfaReceived)}
                />
                <StatRow
                  label="Taux moyen"
                  value={fmtRate(kpis.avgRateCfaPerNgn, 4)}
                  sub="CFA/₦"
                />
              </CardContent>
            </Card>
          </div>

          {/* Profit + Stock row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Profit */}
            <Card
              className={cn(
                "border-l-4",
                kpis.beneficeNet > 0
                  ? "border-l-emerald-500"
                  : kpis.beneficeNet < 0
                  ? "border-l-red-500"
                  : "border-l-muted-foreground"
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Bénéfice net
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p
                  className={cn(
                    "text-3xl font-bold tabular-nums mb-1",
                    kpis.beneficeNet > 0
                      ? "text-emerald-600"
                      : kpis.beneficeNet < 0
                      ? "text-destructive"
                      : ""
                  )}
                >
                  {formatCfa(kpis.beneficeNet)}
                </p>
                <ProfitIndicator value={kpis.marginePct} />
                <div className="mt-3 space-y-0.5">
                  <StatRow
                    label="Clients distincts"
                    value={formatNumber(kpis.nbDistinctClients)}
                  />
                  <StatRow
                    label="Nouveaux clients"
                    value={formatNumber(kpis.nbNewClients)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stock */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-zinc-400" />
                  Stock indicatif
                  <span className="text-xs font-normal text-zinc-400">
                    (tout le temps)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-0.5">
                <StatRow
                  label="Stock $"
                  value={fmt$(kpis.stockUsd)}
                />
                <StatRow
                  label="Stock ₦"
                  value={formatNaira(kpis.stockNgn)}
                />
                {kpis.tauxMinCfaPerNgn !== null && (
                  <StatRow
                    label="Taux min suggéré"
                    value={fmtRate(kpis.tauxMinCfaPerNgn, 4)}
                    sub="CFA/₦"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart + Top clients */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Activité — Bénéfice & Volume
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DailyChart data={kpis.dailyStats} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Top clients ₦ → CFA
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {kpis.topClients.length === 0 ? (
                  <p className="text-sm text-zinc-400 py-4 text-center">
                    Aucun client sur cette période
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {kpis.topClients.map((c, i) => (
                      <li
                        key={c.clientId}
                        className="flex items-center gap-2"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {c.fullName}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {c.nbOps} op. · {formatCfa(c.totalCfaReceived)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
