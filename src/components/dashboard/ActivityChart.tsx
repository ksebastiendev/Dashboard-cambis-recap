"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyActivity } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCfa } from "@/lib/formatters";

interface ActivityChartProps {
  data: DailyActivity[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    shortDate: new Date(item.date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activité sur 7 jours</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="shortDate" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} allowDecimals={false} fontSize={12} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <Tooltip
                cursor={{ fill: "hsla(var(--primary), 0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                }}
                formatter={(value, name) => {
                  const numericValue = typeof value === "number" ? value : Number(value ?? 0);

                  if (name === "Volume") {
                    return [formatCfa(numericValue), name];
                  }

                  if (name === "Clients") {
                    return [numericValue, name];
                  }

                  return [numericValue, name];
                }}
              />
              <Bar yAxisId="left" dataKey="transactionCount" name="Transactions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} maxBarSize={36} />
              <Line yAxisId="right" type="monotone" dataKey="totalVolumeCfa" name="Volume" stroke="hsl(var(--success))" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}