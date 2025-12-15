"use client";

import { useMemo, useState, memo } from "react";
import { BarChart, Bar, XAxis, CartesianGrid } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { TimeSeriesMetrics } from "../types";

interface SpendChartProps {
  data?: TimeSeriesMetrics[];
  isLoading?: boolean;
  className?: string;
}

const chartConfig = {
  cost: {
    label: "Cost",
    color: "hsl(var(--primary))",
  },
};

export const SpendChart = memo(function SpendChart({
  data,
  isLoading,
  className,
}: SpendChartProps) {
  const [groupBy, setGroupBy] = useState<"1d" | "7d" | "30d">("1d");

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group data if needed
    if (groupBy === "1d") {
      return data.map((d) => ({
        date: d.date,
        cost: d.cost,
        label: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }));
    }

    // Group by week or month
    const grouped: Record<string, { cost: number; count: number }> = {};
    data.forEach((d) => {
      const date = new Date(d.date);
      let key: string;
      if (groupBy === "7d") {
        // Week number
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        // Month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
      if (!grouped[key]) grouped[key] = { cost: 0, count: 0 };
      grouped[key].cost += d.cost;
      grouped[key].count++;
    });

    return Object.entries(grouped).map(([key, value]) => ({
      date: key,
      cost: value.cost,
      label:
        groupBy === "7d"
          ? `Week of ${new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : new Date(key + "-01").toLocaleDateString("en-US", {
              month: "short",
              year: "2-digit",
            }),
    }));
  }, [data, groupBy]);

  const totalSpend = useMemo(() => {
    if (!data) return 0;
    return data.reduce((acc, d) => acc + d.cost, 0);
  }, [data]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-[280px] w-full" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Spend</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight">
              ${totalSpend.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={groupBy}
            onValueChange={(v) => setGroupBy(v as typeof groupBy)}
          >
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Daily</SelectItem>
              <SelectItem value="7d">Weekly</SelectItem>
              <SelectItem value="30d">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No spend data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.4}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                minTickGap={32}
              />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted) / 0.1)" }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey="cost"
                fill="var(--color-cost)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
});
