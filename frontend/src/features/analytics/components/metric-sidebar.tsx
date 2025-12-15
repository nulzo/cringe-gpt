"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkline } from "./sparkline";
import { cn } from "@/lib/utils";
import type {
  TimeSeriesMetrics,
  MetricsByModel,
  MetricsByProvider,
} from "../types";

interface MetricSidebarProps {
  timeSeries?: TimeSeriesMetrics[];
  byModel?: MetricsByModel[];
  byProvider?: MetricsByProvider[];
  totalCost?: number;
  totalTokens?: number;
  totalRequests?: number;
  isLoading?: boolean;
  className?: string;
}

export function MetricSidebar({
  timeSeries,
  byModel,
  byProvider,
  totalCost = 0,
  totalTokens = 0,
  totalRequests = 0,
  isLoading,
  className,
}: MetricSidebarProps) {
  const tokenSparkline = useMemo(() => {
    if (!timeSeries) return [];
    return timeSeries.map((d) => d.promptTokens + d.completionTokens);
  }, [timeSeries]);

  const requestSparkline = useMemo(() => {
    if (!timeSeries) return [];
    return timeSeries.map((d) => d.requests);
  }, [timeSeries]);

  // Get current month name
  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
  });

  // Calculate days until reset (end of month)
  const daysUntilReset = useMemo(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil(
      (endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }, []);

  // Mock budget for now (could be from user settings)
  const budget = 100;
  const budgetUsed = totalCost;
  const budgetPercent = Math.min((budgetUsed / budget) * 100, 100);

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Budget Section */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{currentMonth} budget</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold">
            ${budgetUsed.toFixed(2)}
          </span>
          <span className="text-muted-foreground">/ ${budget}</span>
        </div>
        <Progress value={budgetPercent} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          Resets in {daysUntilReset} days.{" "}
          <button className="text-primary hover:underline">Edit budget</button>
        </p>
      </div>

      {/* Total Tokens */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Total tokens</p>
        <p className="text-2xl font-semibold">{totalTokens.toLocaleString()}</p>
        <Sparkline
          data={tokenSparkline}
          width="100%"
          height={32}
          color="hsl(var(--chart-1))"
          className="w-full"
        />
      </div>

      {/* Total Requests */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Total requests</p>
        <p className="text-2xl font-semibold">
          {totalRequests.toLocaleString()}
        </p>
        <Sparkline
          data={requestSparkline}
          width="100%"
          height={32}
          color="hsl(var(--primary))"
          className="w-full"
        />
      </div>

      {/* Users / Models / Providers breakdown */}
      <Tabs defaultValue="models" className="w-full">
        <TabsList className="h-8 w-full justify-start border-b bg-transparent p-0">
          <TabsTrigger
            value="models"
            className="h-8 rounded-none border-b-2 border-transparent px-3 pb-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent"
          >
            Models
          </TabsTrigger>
          <TabsTrigger
            value="providers"
            className="h-8 rounded-none border-b-2 border-transparent px-3 pb-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent"
          >
            Providers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="mt-3 space-y-2">
          {byModel && byModel.length > 0 ? (
            byModel.slice(0, 5).map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                      {m.model.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[140px] truncate text-xs">
                    {m.model}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {m.summary.totalRequests}
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No model data available
            </p>
          )}
        </TabsContent>

        <TabsContent value="providers" className="mt-3 space-y-2">
          {byProvider && byProvider.length > 0 ? (
            byProvider.slice(0, 5).map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                      {p.provider.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[140px] truncate text-xs">
                    {p.provider}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {p.summary.totalRequests}
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No provider data available
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
