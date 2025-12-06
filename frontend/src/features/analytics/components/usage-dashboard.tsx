"use client"

import { useMemo, useState } from "react"
import { IconDownload, IconCalendar, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { SpendChart } from "./spend-chart"
import { CapabilityCard } from "./capability-card"
import { MetricSidebar } from "./metric-sidebar"
import { useDashboardAnalytics } from "../api/get-dashboard-analytics"
import { useTimeSeriesMetrics } from "../api/get-time-series"
import { useAnalyticsTimeRange, useAnalyticsFilters, useSetTimeRange, useGetQuickTimeRange } from "@/stores/analytics-store"
import { toQueryParams } from "../utils/params"
import type { DateRange } from "react-day-picker"
import { fillMissingDates } from "@/features/analytics/utils/chart-helpers"

export function UsageDashboard() {
  const timeRange = useAnalyticsTimeRange()
  const filters = useAnalyticsFilters()
  const setTimeRange = useSetTimeRange()
  const getQuickTimeRange = useGetQuickTimeRange()

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (timeRange.from && timeRange.to) {
      return { from: new Date(timeRange.from), to: new Date(timeRange.to) }
    }
    return undefined
  })

  const params = useMemo(() => toQueryParams(timeRange, filters.groupBy), [timeRange, filters.groupBy])

  // Fetch data
  const { data: dashboard, isLoading: dashboardLoading } = useDashboardAnalytics(params)
  const { data: timeSeries, isLoading: timeSeriesLoading } = useTimeSeriesMetrics(params)

  const isLoading = dashboardLoading || timeSeriesLoading

  // Format date range for display
  const dateRangeLabel = useMemo(() => {
    if (timeRange.preset) {
      const labels: Record<string, string> = {
        "7d": "Last 7 days",
        "30d": "Last 30 days",
        "90d": "Last 90 days",
        "1y": "Last year",
        "all": "All time",
      }
      return labels[timeRange.preset] || "Custom"
    }
    if (timeRange.from && timeRange.to) {
      const from = new Date(timeRange.from)
      const to = new Date(timeRange.to)
      return `${from.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })} - ${to.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}`
    }
    return "Select dates"
  }, [timeRange])

  // Handle date selection
  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      setTimeRange({
        from: range.from,
        to: range.to,
        preset: undefined,
      })
    }
  }

  // Normalize time series to fill missing days within the selected range
  const normalizedSeries = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return []
    const start = timeRange.from ? new Date(timeRange.from) : undefined
    const end = timeRange.to ? new Date(timeRange.to) : undefined
    return fillMissingDates(timeSeries, "date", "day", start, end)
  }, [timeSeries, timeRange.from, timeRange.to])

  // Prepare capability card data
  const capabilityData = useMemo(() => {
    if (!normalizedSeries) return []

    return [
      {
        title: "Responses and Chat Completions",
        metrics: [
          { label: "requests", value: dashboard?.overall.totalRequests || 0, color: "hsl(var(--primary))" },
          { label: "input tokens", value: `${((dashboard?.overall.totalPromptTokens || 0) / 1000).toFixed(1)}K`, color: "hsl(var(--muted-foreground))" },
        ],
        chartData: normalizedSeries.map((d) => ({ date: d.date, value: d.requests })),
      },
      {
        title: "Token Usage",
        metrics: [
          { label: "prompt tokens", value: dashboard?.overall.totalPromptTokens || 0, color: "hsl(var(--primary))" },
          { label: "completion tokens", value: dashboard?.overall.totalCompletionTokens || 0, color: "hsl(var(--chart-2))" },
        ],
        chartData: normalizedSeries.map((d) => ({ date: d.date, value: d.promptTokens + d.completionTokens })),
      },
      {
        title: "Cost Breakdown",
        metrics: [
          { label: "total cost", value: `$${(dashboard?.costBreakdown.totalCost || 0).toFixed(2)}`, color: "hsl(var(--primary))" },
          { label: "per request", value: `$${(dashboard?.costBreakdown.averageCostPerRequest || 0).toFixed(4)}`, color: "hsl(var(--muted-foreground))" },
        ],
        chartData: normalizedSeries.map((d) => ({ date: d.date, value: d.cost * 100 })), // Scale for visibility
      },
      {
        title: "Performance",
        metrics: [
          { label: "avg response", value: `${Math.round(dashboard?.performance.averageResponseTime || 0)}ms`, color: "hsl(var(--primary))" },
          { label: "success rate", value: `${Math.round(dashboard?.performance.successRate || 100)}%`, color: "hsl(var(--chart-3))" },
        ],
        chartData: normalizedSeries.map((d) => ({ date: d.date, value: d.averageDurationMs })),
      },
    ]
  }, [normalizedSeries, dashboard])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 px-6 py-4">
        <h1 className="text-xl font-semibold">Usage</h1>

        <div className="flex items-center gap-2">
          {/* Project filter (placeholder) */}
          <Badge
            variant="secondary"
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-secondary/80"
          >
            Default project
            <IconX className="h-3 w-3" />
          </Badge>

          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                className="h-8 gap-2 rounded-full px-3 text-xs"
              >
                <IconCalendar className="h-3.5 w-3.5" />
                {dateRangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col">
                <div className="flex gap-1 border-b p-2">
                  {["7d", "30d", "90d", "1y", "all"].map((preset) => (
                    <Button
                      key={preset}
                      variant={timeRange.preset === preset ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        const range = getQuickTimeRange(preset as any)
                        setTimeRange(range)
                        setDateRange(undefined)
                      }}
                    >
                      {preset === "7d" ? "7D" : preset === "30d" ? "30D" : preset === "90d" ? "90D" : preset === "1y" ? "1Y" : "All"}
                    </Button>
                  ))}
                </div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  className="p-3"
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Export button */}
          <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
            <IconDownload className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Charts and capabilities */}
        <main className="flex-1 overflow-y-auto border-r border-border/40 p-6">
          {/* Spend Chart */}
          <SpendChart
            data={normalizedSeries}
            isLoading={isLoading}
            className="mb-8"
          />

          {/* Tabs */}
          <Tabs defaultValue="capabilities" className="w-full">
            <TabsList className="h-9 w-auto justify-start border-b bg-transparent p-0">
              <TabsTrigger
                value="capabilities"
                className="h-9 rounded-none border-b-2 border-transparent px-4 pb-2 text-sm data-[state=active]:border-foreground data-[state=active]:bg-transparent"
              >
                API capabilities
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="h-9 rounded-none border-b-2 border-transparent px-4 pb-2 text-sm data-[state=active]:border-foreground data-[state=active]:bg-transparent"
              >
                Spend categories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="capabilities" className="mt-6">
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/60 p-4">
                      <Skeleton className="mb-2 h-4 w-40" />
                      <Skeleton className="mb-4 h-3 w-32" />
                      <Skeleton className="h-[120px] w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {capabilityData.map((cap, i) => (
                    <CapabilityCard
                      key={i}
                      title={cap.title}
                      metrics={cap.metrics}
                      chartData={cap.chartData}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/60 p-4">
                      <Skeleton className="mb-2 h-4 w-40" />
                      <Skeleton className="mb-4 h-3 w-32" />
                      <Skeleton className="h-[120px] w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <CapabilityCard
                    title="By Provider"
                    metrics={
                      dashboard?.byProvider.slice(0, 3).map((p) => ({
                        label: p.provider,
                        value: `$${p.summary.totalCost.toFixed(2)}`,
                        color: "hsl(var(--primary))",
                      })) || []
                    }
                    chartData={normalizedSeries?.map((d) => ({ date: d.date, value: d.cost * 100 }))}
                  />
                  <CapabilityCard
                    title="By Model"
                    metrics={
                      dashboard?.byModel.slice(0, 3).map((m) => ({
                        label: m.model,
                        value: `$${m.summary.totalCost.toFixed(2)}`,
                        color: "hsl(var(--chart-2))",
                      })) || []
                    }
                    chartData={normalizedSeries?.map((d) => ({ date: d.date, value: d.requests }))}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: Sidebar metrics */}
        <aside className="w-80 shrink-0 overflow-y-auto p-6">
          <MetricSidebar
            timeSeries={normalizedSeries}
            byModel={dashboard?.byModel}
            byProvider={dashboard?.byProvider}
            totalCost={dashboard?.costBreakdown.totalCost}
            totalTokens={dashboard?.overall.totalTokens}
            totalRequests={dashboard?.overall.totalRequests}
            isLoading={isLoading}
          />
        </aside>
      </div>
    </div>
  )
}
