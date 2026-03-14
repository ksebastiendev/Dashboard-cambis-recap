import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendBadge } from "@/components/shared/TrendBadge";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: number | null;
  icon: LucideIcon;
  weekTrend?: number | null;
  extra?: string;
}

export function KpiCard({ title, value, subtitle, trend, icon: Icon, weekTrend, extra }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          <TrendBadge value={trend} />
        </div>
        {weekTrend !== undefined && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <p className="text-xs text-muted-foreground">vs semaine préc.</p>
            <TrendBadge value={weekTrend ?? null} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}