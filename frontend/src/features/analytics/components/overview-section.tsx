"use client"

import { memo, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig
} from "@/components/ui/chart"
import { Area, AreaChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Bar, BarChart } from "recharts"
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from "lucide-react"
import { KPI, KPISkeleton } from "./kpi"
import { useAnalyticsFilters, useAnalyticsTimeRange } from "@/stores/analytics-store"
import { useDashboardAnalytics } from "@/features/analytics/api/get-dashboard-analytics"
import { useTimeSeriesMetrics } from "@/features/analytics/api/get-time-series"
import { toQueryParams } from "@/features/analytics/utils/params"
import { fillMissingDates, getFullWidthChartClass } from "@/features/analytics/utils/chart-helpers"
import type { TimeSeriesMetrics } from "../types"

function OverviewSection() {
    const timeRange = useAnalyticsTimeRange()
    const filters = useAnalyticsFilters()

    // Helper function to get time range label
    const getTimeRangeLabel = () => {
        if (timeRange.preset) {
            const labels: Record<string, string> = {
                "7d": "7 days",
                "30d": "30 days",
                "90d": "90 days",
                "1y": "1 year",
                "all": "all time"
            }
            return labels[timeRange.preset] || timeRange.preset
        }
        return "selected period"
    }

    // Helper function to get grouping label
    const getGroupingLabel = () => {
        const labels: Record<string, string> = {
            "hour": "hourly",
            "day": "daily",
            "month": "monthly"
        }
        return labels[filters.groupBy || "day"] || "daily"
    }
    const params = useMemo(() => toQueryParams(timeRange, filters.groupBy), [timeRange, filters.groupBy])

    const dashboard = useDashboardAnalytics(params)
    const series = useTimeSeriesMetrics(params)

    return (
        <div className="space-y-6">
            {/* KPIs Section */}
            {dashboard.isLoading ? (
                <KPISkeleton />
            ) : dashboard.isError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>Failed to load analytics data. Please try again.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dashboard.refetch()}
                            className="ml-2"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : dashboard.data ? (
                <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                    <KPI
                        label="Total Cost"
                        value={`$${(dashboard.data.costBreakdown.totalCost ?? 0).toFixed(4)}`}
                        hint={`$${dashboard.data.costBreakdown.averageCostPerRequest?.toFixed(4)} per request`}
                        trend={dashboard.data.costBreakdown.promptCost > 0 ? "up" : "down"}
                    />
                    <KPI
                        label="Total Requests"
                        value={(dashboard.data.overall.totalRequests ?? 0).toLocaleString()}
                        hint={`${Math.round(dashboard.data.overall.averageTokensPerRequest ?? 0)} tokens/req`}
                        trend="up"
                    />
                    <KPI
                        label="Total Tokens"
                        value={(dashboard.data.overall.totalTokens ?? 0).toLocaleString()}
                        hint={`${Math.round(dashboard.data.overall.totalPromptTokens ?? 0).toLocaleString()} prompt, ${(dashboard.data.overall.totalCompletionTokens ?? 0).toLocaleString()} completion`}
                        trend="up"
                    />
                    <KPI
                        label="Avg. Response Time"
                        value={`${Math.round(dashboard.data.overall.averageDurationMs ?? 0)}ms`}
                        hint={`${Math.round(dashboard.data.performance.medianResponseTime ?? 0)}ms median`}
                        trend={dashboard.data.performance.averageResponseTime < 1000 ? "down" : "up"}
                    />
                </div>
            ) : null}

            {/* Time Series Charts */}
            <div className="grid gap-6 @[80rem]:grid-cols-2">
                {/* Requests & Cost Over Time */}
                <Card className="border-border/60 bg-card/70 backdrop-blur-sm shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Usage & Cost Trends ({getTimeRangeLabel()})
                            {series.data && series.data.length > 0 && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    {(() => {
                                        const first = series.data[0]?.requests || 0
                                        const last = series.data[series.data.length - 1]?.requests || 0
                                        const change = last - first
                                        const percent = first > 0 ? (change / first) * 100 : 0
                                        return (
                                            <>
                                                {change >= 0 ? (
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                                )}
                                                <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                                                    {Math.abs(percent).toFixed(1)}%
                                                </span>
                                            </>
                                        )
                                    })()}
                                </div>
                            )}
                        </CardTitle>
                        <CardDescription>{getGroupingLabel()} requests and costs over {getTimeRangeLabel()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {series.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : series.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load time series data</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => series.refetch()}
                                        className="mt-2"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Retry
                                    </Button>
                                </div>
                            </div>
                        ) : series.data && series.data.length > 0 ? (
                            <TimeSeriesChart
                                data={series.data}
                                config={{
                                    requests: {
                                        label: "Requests",
                                        color: "var(--chart-1)",
                                    },
                                    cost: {
                                        label: "Cost ($)",
                                        color: "var(--chart-2)",
                                    },
                                }}
                            />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No data available for the selected period
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Token Usage Breakdown */}
                <Card className="border-border/60 bg-card/70 backdrop-blur-sm shadow-sm">
                    <CardHeader>
                        <CardTitle>Token Usage Breakdown ({getTimeRangeLabel()})</CardTitle>
                        <CardDescription>{getGroupingLabel()} prompt vs completion tokens</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {series.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : series.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load token data</p>
                                </div>
                            </div>
                        ) : series.data && series.data.length > 0 ? (
                            <TokenBreakdownChart data={series.data} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No token data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            {dashboard.data && (
                <Card className="border-border/60 bg-card/70 backdrop-blur-sm shadow-sm">
                    <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>Response times and system performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Average Response Time</div>
                                <div className="text-2xl font-semibold">
                                    {Math.round(dashboard.data.performance.averageResponseTime ?? 0)}ms
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Median: {Math.round(dashboard.data.performance.medianResponseTime ?? 0)}ms
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">P95 Response Time</div>
                                <div className="text-2xl font-semibold">
                                    {Math.round(dashboard.data.performance.p95ResponseTime ?? 0)}ms
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    95th percentile
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Success Rate</div>
                                <div className="text-2xl font-semibold">
                                    {Math.round(dashboard.data.performance.successRate ?? 100)}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Error rate: {Math.round(dashboard.data.performance.totalErrors ?? 0)}%
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Tokens/Second</div>
                                <div className="text-2xl font-semibold">
                                    {Math.round(dashboard.data.performance.tokensPerSecond ?? 0)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Processing speed
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// Enhanced Time Series Chart with Area fill
function TimeSeriesChart({
    data,
    config
}: {
    data: TimeSeriesMetrics[]
    config: ChartConfig
}) {
    // Fill missing dates with 0 values
    const filledData = fillMissingDates(data);

    return (
        <ChartContainer config={config} className={getFullWidthChartClass()}>
            <AreaChart data={filledData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                    <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-requests)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-requests)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-cost)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-cost)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })
                    }}
                />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} width={50} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} width={60} />
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            labelFormatter={(value) => {
                                return new Date(value).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })
                            }}
                        />
                    }
                />
                <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="requests"
                    stroke="var(--color-requests)"
                    fill="url(#fillRequests)"
                    strokeWidth={2}
                    name="Requests"
                />
                <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="cost"
                    stroke="var(--color-cost)"
                    fill="url(#fillCost)"
                    strokeWidth={2}
                    name="Cost ($)"
                />
                <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
        </ChartContainer>
    )
}

// Token Breakdown Chart
function TokenBreakdownChart({ data }: { data: TimeSeriesMetrics[] }) {
    // Fill missing dates with 0 values
    const filledData = fillMissingDates(data);

    const config: ChartConfig = {
        promptTokens: {
            label: "Prompt Tokens",
            color: "var(--chart-1)",
        },
        completionTokens: {
            label: "Completion Tokens",
            color: "var(--chart-2)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass()}>
            <BarChart data={filledData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })
                    }}
                />
                <YAxis axisLine={false} tickLine={false} width={50} />
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            labelFormatter={(value) => {
                                return new Date(value).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })
                            }}
                        />
                    }
                />
                <Bar
                    dataKey="promptTokens"
                    fill="var(--color-promptTokens)"
                    radius={[2, 2, 0, 0]}
                    name="Prompt Tokens"
                />
                <Bar
                    dataKey="completionTokens"
                    fill="var(--color-completionTokens)"
                    radius={[2, 2, 0, 0]}
                    name="Completion Tokens"
                />
                <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
        </ChartContainer>
    )
}

export default memo(OverviewSection)

