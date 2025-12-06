"use client"

import { memo, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAnalyticsFilters, useAnalyticsTimeRange } from "@/stores/analytics-store"
import { usePerformanceAnalytics } from "@/features/analytics/api/get-performance-analytics"
import { usePerformanceTrends } from "@/features/analytics/api/get-trends"
import { toQueryParams } from "@/features/analytics/utils/params"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area, ResponsiveContainer } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig
} from "@/components/ui/chart"
import { KPI, ComparisonKPI } from "./kpi"
import { Zap, Clock, TrendingUp, Activity, RefreshCw, AlertCircle } from "lucide-react"

function PerformanceSection() {
    const timeRange = useAnalyticsTimeRange()
    const filters = useAnalyticsFilters()
    const params = useMemo(() => toQueryParams(timeRange, filters.groupBy), [timeRange, filters.groupBy])

    const performance = usePerformanceAnalytics(params)
    const trends = usePerformanceTrends(params)

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

    return (
        <div className="space-y-6">
            {/* Performance KPIs */}
            {performance.isLoading ? (
                <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="pb-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-32 mt-2" />
                                <Skeleton className="h-3 w-20 mt-2" />
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : performance.isError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>Failed to load performance metrics.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => performance.refetch()}
                            className="ml-2"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : performance.data ? (
                <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                    <KPI
                        label="Avg Response Time"
                        value={`${Math.round(performance.data.averageResponseTime ?? 0)}ms`}
                        hint={`Median: ${Math.round(performance.data.medianResponseTime ?? 0)}ms`}
                        trend={performance.data.averageResponseTime < 1000 ? "down" : "up"}
                    />
                    <KPI
                        label="P95 Response Time"
                        value={`${Math.round(performance.data.p95ResponseTime ?? 0)}ms`}
                        hint="95th percentile"
                        trend={performance.data.p95ResponseTime < 2000 ? "down" : "up"}
                    />
                    <KPI
                        label="Success Rate"
                        value={`${Math.round(performance.data.successRate ?? 100)}%`}
                        hint={`${performance.data.totalErrors ?? 0} errors`}
                        trend={(performance.data.successRate ?? 100) >= 99 ? "up" : "down"}
                    />
                    <KPI
                        label="Throughput"
                        value={`${(performance.data.tokensPerSecond ?? 0).toFixed(1)}`}
                        hint="tokens/second"
                        trend="up"
                    />
                </div>
            ) : null}

            {/* Performance Charts */}
            <div className="grid gap-6 @[80rem]:grid-cols-2">
                {/* Response Time Distribution */}
                <Card className="border-border/60 bg-card/70 backdrop-blur-sm shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Response Time Distribution
                        </CardTitle>
                        <CardDescription>Performance percentiles and distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {performance.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : performance.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load performance data</p>
                                </div>
                            </div>
                        ) : performance.data ? (
                            <ResponseTimeChart data={performance.data} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No performance data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Performance Trends */}
                <Card className="border-border/60 bg-card/70 backdrop-blur-sm shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Performance Trends ({getTimeRangeLabel()})
                        </CardTitle>
                        <CardDescription>{getGroupingLabel()} response time trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {trends.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : trends.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load trend data</p>
                                </div>
                            </div>
                        ) : trends.data && Object.keys(trends.data).length > 0 ? (
                            <PerformanceTrendsChart data={trends.data} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No trend data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Performance Insights */}
            {performance.data && (
                <Card className="border-border/60 bg-card/70 backdrop-blur-sm shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Performance Insights
                        </CardTitle>
                        <CardDescription>Analysis and recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 @[48rem]:grid-cols-2 @[80rem]:grid-cols-3">
                            {/* Response Time Status */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant={
                                        (performance.data.averageResponseTime ?? 0) < 500 ? "secondary" :
                                        (performance.data.averageResponseTime ?? 0) < 1000 ? "outline" : "destructive"
                                    } className="text-xs">
                                        Response Time
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Performance</span>
                                        <span className="font-medium">
                                            {(performance.data.averageResponseTime ?? 0) < 500 ? "Excellent" :
                                             (performance.data.averageResponseTime ?? 0) < 1000 ? "Good" :
                                             (performance.data.averageResponseTime ?? 0) < 2000 ? "Fair" : "Slow"}
                                        </span>
                                    </div>
                                    <Progress
                                        value={Math.min(100, Math.max(0, 100 - (performance.data.averageResponseTime ?? 0) / 20))}
                                        className="h-2"
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Target: &lt;500ms for excellent performance
                                </div>
                            </div>

                            {/* Success Rate */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant={
                                        (performance.data.successRate ?? 100) >= 99.5 ? "secondary" :
                                        (performance.data.successRate ?? 100) >= 98 ? "outline" : "destructive"
                                    } className="text-xs">
                                        Reliability
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Success Rate</span>
                                        <span className="font-medium">
                                            {Math.round(performance.data.successRate ?? 100)}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={performance.data.successRate ?? 100}
                                        className="h-2"
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {performance.data.totalErrors ?? 0} errors in period
                                </div>
                            </div>

                            {/* Throughput */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        <Zap className="h-3 w-3 mr-1" />
                                        Throughput
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-2xl font-bold">
                                        {(performance.data.tokensPerSecond ?? 0).toFixed(1)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        tokens per second
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {Math.round((performance.data.tokensPerSecond ?? 0) * 60)} tokens/minute
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// Enhanced Response Time Chart
function ResponseTimeChart({ data }: { data: any }) {
    const chartData = [
        {
            metric: "Average",
            value: data.averageResponseTime ?? 0,
            color: "var(--chart-1)"
        },
        {
            metric: "Median",
            value: data.medianResponseTime ?? 0,
            color: "var(--chart-2)"
        },
        {
            metric: "P95",
            value: data.p95ResponseTime ?? 0,
            color: "var(--chart-3)"
        }
    ]

    const config: ChartConfig = {
        average: {
            label: "Average Response Time",
            color: "var(--chart-1)",
        },
        median: {
            label: "Median Response Time",
            color: "var(--chart-2)",
        },
        p95: {
            label: "P95 Response Time",
            color: "var(--chart-3)",
        },
    }

    return (
        <ChartContainer config={config} className="h-[300px]">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                    <linearGradient id="fillAverage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-average)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-average)" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="fillMedian" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-median)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-median)" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="fillP95" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-p95)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-p95)" stopOpacity={0.2} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                    dataKey="metric"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}ms`}
                />
                <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                                <div className="rounded-lg border bg-background p-3 shadow-sm">
                                    <div className="font-medium">{label}</div>
                                    <div className="text-sm text-muted-foreground mb-2">
                                        Response Time
                                    </div>
                                    <div className="font-mono font-medium text-lg">
                                        {data.value}ms
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {label === "P95" ? "95th percentile" :
                                         label === "Median" ? "50th percentile" : "Average"}
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Bar
                    dataKey="value"
                    fill="url(#fillAverage)"
                    radius={[4, 4, 0, 0]}
                    name="Response Time"
                />
            </BarChart>
        </ChartContainer>
    )
}

// Performance Trends Chart
function PerformanceTrendsChart({ data }: { data: Record<string, number> }) {
    const chartData = Object.entries(data)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, responseTime]) => ({
            date,
            responseTime,
            formattedDate: new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            })
        }))

    const config: ChartConfig = {
        responseTime: {
            label: "Response Time (ms)",
            color: "var(--chart-1)",
        },
    }

    return (
        <ChartContainer config={config} className="h-[300px]">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}ms`}
                />
                <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="font-medium">{label}</div>
                                    <div className="font-mono font-medium">
                                        {data.responseTime}ms
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="var(--color-responseTime)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Response Time"
                />
            </LineChart>
        </ChartContainer>
    )
}

export default memo(PerformanceSection)

