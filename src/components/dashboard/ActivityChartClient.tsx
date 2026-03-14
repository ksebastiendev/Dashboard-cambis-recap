"use client";

import dynamic from "next/dynamic";
import type { DailyActivity } from "@/types";

const ActivityChart = dynamic(
  () => import("@/components/dashboard/ActivityChart").then((module) => module.ActivityChart),
  {
    ssr: false,
    loading: () => <div className="h-[376px] animate-pulse rounded-xl border border-border bg-card" />,
  }
);

interface ActivityChartClientProps {
  data: DailyActivity[];
}

export function ActivityChartClient({ data }: ActivityChartClientProps) {
  return <ActivityChart data={data} />;
}