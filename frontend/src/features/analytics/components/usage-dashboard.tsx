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
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-8 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
          <p className="text-sm text-muted-foreground">Track your API usage and spending</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 border-dashed text-xs"
              >
                <IconCalendar className="h-3.5 w-3.5" />
                {dateRangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col">
                <div className="flex gap-1 border-b p-2">
                  {["7d", "30d", "90d", "all"].map((preset) => (
                    <Button
                      key={preset}
                      variant={timeRange.preset === preset ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        const range = getQuickTimeRange(preset as any)
                        setTimeRange(range)
                        setDateRange(undefined)
                      }}
                    >
                      {preset === "7d" ? "7D" : preset === "30d" ? "30D" : preset === "90d" ? "90D" : "All"}
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
          <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
            <IconDownload className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Charts and capabilities */}
        <main className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Spend Chart */}
            <section>
              <SpendChart
                data={normalizedSeries}
                isLoading={isLoading}
                className="rounded-xl border bg-card p-6 shadow-sm"
              />
            </section>

            {/* Tabs */}
            <Tabs defaultValue="capabilities" className="w-full">
              <div className="mb-4 border-b">
                <TabsList className="h-auto w-auto justify-start bg-transparent p-0">
                  <TabsTrigger
                    value="capabilities"
                    className="relative h-9 rounded-none border-b-2 border-transparent px-4 pb-2 text-sm font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    API capabilities
                  </TabsTrigger>
                  <TabsTrigger
                    value="categories"
                    className="relative h-9 rounded-none border-b-2 border-transparent px-4 pb-2 text-sm font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Spend categories
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="capabilities" className="mt-0">
                {isLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-border/60 p-4">
                        <Skeleton className="mb-2 h-4 w-24" />
                        <Skeleton className="mb-4 h-3 w-16" />
                        <Skeleton className="h-[100px] w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

              <TabsContent value="categories" className="mt-0">
                {isLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-border/60 p-4">
                        <Skeleton className="mb-2 h-4 w-24" />
                        <Skeleton className="mb-4 h-3 w-16" />
                        <Skeleton className="h-[100px] w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </main>

        {/* Right: Sidebar metrics */}
        <aside className="hidden w-80 shrink-0 border-l border-border/40 bg-muted/10 p-6 xl:block">
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
