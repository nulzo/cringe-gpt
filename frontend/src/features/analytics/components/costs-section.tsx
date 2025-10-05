"use client"

import { memo, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAnalyticsFilters, useAnalyticsTimeRange } from "@/stores/analytics-store"
import { useCostBreakdown } from "@/features/analytics/api/get-cost-breakdown"
import { useProvidersAnalytics } from "@/features/analytics/api/get-providers-analytics"
import { useCostTrends } from "@/features/analytics/api/get-trends"
import { toQueryParams } from "@/features/analytics/utils/params"
import { getFullWidthChartClass } from "@/features/analytics/utils/chart-helpers"
import { PieChart, Pie, BarChart, XAxis, YAxis, Bar, Label, AreaChart, Area, Cell } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig
} from "@/components/ui/chart"
import { ComparisonKPI } from "./kpi"
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, DollarSign, CreditCard, PieChart as PieChartIcon } from "lucide-react"
import type { MetricsByProvider } from "../types"

function CostsSection() {
    const timeRange = useAnalyticsTimeRange()
    const filters = useAnalyticsFilters()
    const params = useMemo(() => toQueryParams(timeRange, filters.groupBy), [timeRange, filters.groupBy])

    const costBreakdown = useCostBreakdown(params)
    const providers = useProvidersAnalytics(params)
    const costTrends = useCostTrends(params)

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
            {/* Cost Summary KPIs */}
            {costBreakdown.isLoading ? (
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
            ) : costBreakdown.isError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>Failed to load cost analytics data.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => costBreakdown.refetch()}
                            className="ml-2"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : costBreakdown.data ? (
                <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                    <ComparisonKPI
                        label="Total Cost"
                        value={Number(costBreakdown.data.totalCost)}
                        format="currency"
                        hint="Total spending in selected period"
                    />
                    <ComparisonKPI
                        label="Avg Cost/Request"
                        value={Number(costBreakdown.data.averageCostPerRequest)}
                        format="currency"
                        hint="Cost efficiency metric"
                    />
                    <ComparisonKPI
                        label="Avg Cost/Token"
                        value={Number(costBreakdown.data.averageCostPerToken)}
                        format="currency"
                        hint="Token efficiency"
                    />
                    <Card className="transition-all duration-200 hover:shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Most Expensive
                            </CardTitle>
                            <CardDescription className="text-lg font-bold text-foreground mt-1">
                                {costBreakdown.data.mostExpensiveModel || "N/A"}
                            </CardDescription>
                            <div className="text-xs text-muted-foreground mt-1">
                                {costBreakdown.data.mostExpensiveProvider || "No data"}
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            ) : null}

            {/* Cost Visualization Charts */}
            <div className="grid gap-6 @[80rem]:grid-cols-2">
                {/* Cost Distribution Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5" />
                            Cost Distribution
                        </CardTitle>
                        <CardDescription>Breakdown of prompt vs completion costs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {costBreakdown.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : costBreakdown.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load cost distribution</p>
                                </div>
                            </div>
                        ) : costBreakdown.data ? (
                            <CostDistributionChart data={costBreakdown.data} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No cost data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cost by Provider Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Cost by Provider
                        </CardTitle>
                        <CardDescription>Spending distribution across AI providers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {providers.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : providers.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load provider costs</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => providers.refetch()}
                                        className="mt-2"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Retry
                                    </Button>
                                </div>
                            </div>
                        ) : providers.data && providers.data.length > 0 ? (
                            <ProviderCostChart data={providers.data} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No provider data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Cost Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Cost Trends ({getTimeRangeLabel()})</CardTitle>
                    <CardDescription>{getGroupingLabel()} spending patterns and trends</CardDescription>
                </CardHeader>
                <CardContent>
                    {costTrends.isLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : costTrends.isError ? (
                        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                            <div className="text-center">
                                <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p>Failed to load cost trends</p>
                            </div>
                        </div>
                    ) : costTrends.data && Object.keys(costTrends.data).length > 0 ? (
                        <CostTrendsChart data={costTrends.data} />
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                            No trend data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cost Efficiency Insights */}
            {costBreakdown.data && (
                <Card>
                    <CardHeader>
                        <CardTitle>Cost Efficiency Insights</CardTitle>
                        <CardDescription>Analysis and recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-3">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        Efficiency
                                    </Badge>
                                    <span className="text-sm font-medium">Cost per Token</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    ${(costBreakdown.data.averageCostPerToken * 1000).toFixed(4)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Per 1K tokens
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        Usage
                                    </Badge>
                                    <span className="text-sm font-medium">Request Efficiency</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {Math.round(costBreakdown.data.averageCostPerRequest * 1000)}ms
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Avg cost per request
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        Insight
                                    </Badge>
                                    <span className="text-sm font-medium">Cost Ratio</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {costBreakdown.data.promptCost > 0 ?
                                        ((costBreakdown.data.promptCost / costBreakdown.data.totalCost) * 100).toFixed(1) : 0}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Prompt vs Completion
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// Enhanced Cost Distribution Chart
function CostDistributionChart({ data }: { data: any }) {
    const chartData = [
        {
            name: "Prompt Cost",
            value: Number(data.promptCost || 0),
            fill: "var(--chart-1)",
            percentage: data.totalCost > 0 ? ((data.promptCost / data.totalCost) * 100).toFixed(1) : 0
        },
        {
            name: "Completion Cost",
            value: Number(data.completionCost || 0),
            fill: "var(--chart-2)",
            percentage: data.totalCost > 0 ? ((data.completionCost / data.totalCost) * 100).toFixed(1) : 0
        }
    ]

    const config: ChartConfig = {
        value: {
            label: "Cost",
            color: "var(--chart-1)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass()}>
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                {data.name}
                                            </span>
                                            <span className="font-bold text-muted-foreground">
                                                ${data.value.toFixed(4)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Percentage
                                            </span>
                                            <span className="font-bold">
                                                {data.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                                    />
                                    <Pie
                    data={chartData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={60}
                                        strokeWidth={5}
                                    >
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                    return (
                                                        <text
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                        >
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                className="fill-foreground text-2xl font-bold"
                                                            >
                                            ${Number(data.totalCost || 0).toFixed(4)}
                                                            </tspan>
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={(viewBox.cy || 0) + 24}
                                                                className="fill-muted-foreground text-sm"
                                                            >
                                                                Total Cost
                                                            </tspan>
                                                        </text>
                                                    )
                                                }
                                            }}
                                        />
                                    </Pie>
                <ChartLegend content={<ChartLegendContent />} />
                                </PieChart>
                        </ChartContainer>
    )
}

// Enhanced Provider Cost Chart
function ProviderCostChart({ data }: { data: MetricsByProvider[] }) {
    const chartData = data
        .sort((a, b) => Number(b.summary.totalCost) - Number(a.summary.totalCost))
        .slice(0, 8) // Show top 8 providers
        .map(provider => ({
            provider: provider.provider,
            cost: Number(provider.summary.totalCost),
            requests: provider.summary.totalRequests,
            percentage: provider.usagePercentage
        }))

    const config: ChartConfig = {
                                cost: {
                                    label: "Cost ($)",
            color: "var(--chart-1)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass()}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                    <linearGradient id="fillCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-cost)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-cost)" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                                <div className="rounded-lg border bg-background p-3 shadow-sm">
                                    <div className="grid gap-2">
                                        <div className="font-medium">{label}</div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Cost</div>
                                                <div className="font-mono font-medium">
                                                    ${data.cost.toFixed(4)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Requests</div>
                                                <div className="font-mono font-medium">
                                                    {data.requests.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {data.percentage.toFixed(1)}% of total usage
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                                    <XAxis
                                        dataKey="provider"
                    axisLine={false}
                                        tickLine={false}
                                        tickMargin={8}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                                    />
                                    <YAxis
                    axisLine={false}
                                        tickLine={false}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                                    />
                                    <Bar
                                        dataKey="cost"
                    fill="url(#fillCost)"
                                        radius={[4, 4, 0, 0]}
                    name="Cost ($)"
                                    />
                                </BarChart>
                        </ChartContainer>
    )
}

// Cost Trends Chart
function CostTrendsChart({ data }: { data: Record<string, number> }) {
    // Fill missing dates with 0 values
    const sortedEntries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
    const filledData: Array<{ date: string; cost: number; formattedDate: string }> = [];

    if (sortedEntries.length > 0) {
        const firstDate = new Date(sortedEntries[0][0]);
        const lastDate = new Date(sortedEntries[sortedEntries.length - 1][0]);

        const dateMap = new Map(sortedEntries.map(([date, cost]) => [date, cost]));

        const currentDate = new Date(firstDate);
        while (currentDate <= lastDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const cost = dateMap.get(dateStr) || 0;

            // Preserve original date format and avoid timezone conversion issues
            const dateObj = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
            filledData.push({
                date: dateStr,
                cost,
                formattedDate: dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                })
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    const config: ChartConfig = {
        cost: {
            label: "Daily Cost",
            color: "var(--chart-1)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass()}>
            <AreaChart data={filledData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                    <linearGradient id="fillTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-cost)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-cost)" stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value.toFixed(3)}`}
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
                                        ${data.cost.toFixed(4)}
                                    </div>
        </div>
                            )
                        }
                        return null
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="var(--color-cost)"
                    fill="url(#fillTrend)"
                    strokeWidth={2}
                    name="Daily Cost"
                />
            </AreaChart>
        </ChartContainer>
    )
}

export default memo(CostsSection)

