"use client"

import { memo, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnalyticsFilters, useAnalyticsTimeRange } from "@/stores/analytics-store"
import { useProvidersAnalytics } from "@/features/analytics/api/get-providers-analytics"
import { toQueryParams } from "@/features/analytics/utils/params"
import { fillMissingDates, getFullWidthChartClass } from "@/features/analytics/utils/chart-helpers"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig
} from "@/components/ui/chart"
import { ComparisonKPI } from "./kpi"
import { Cloud, DollarSign, Activity, Zap, TrendingUp, Shield, AlertTriangle, CheckCircle, RefreshCw, AlertCircle } from "lucide-react"
import type { MetricsByProvider } from "../types"

function ProvidersSection() {
    const timeRange = useAnalyticsTimeRange()
    const filters = useAnalyticsFilters()
    const [activeTab, setActiveTab] = useState("overview")

    const params = useMemo(() => toQueryParams(timeRange, filters.groupBy), [timeRange, filters.groupBy])
    const providers = useProvidersAnalytics(params)

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

    return (
        <div className="space-y-6">
            {/* Provider KPIs */}
            {providers.isLoading ? (
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
            ) : providers.isError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>Failed to load provider analytics data.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => providers.refetch()}
                            className="ml-2"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : providers.data && providers.data.length > 0 ? (
                <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                    <ComparisonKPI
                        label="Total Providers"
                        value={providers.data.length}
                        format="number"
                        hint="AI providers used"
                    />
                    <ComparisonKPI
                        label="Top Provider Requests"
                        value={providers.data[0]?.summary.totalRequests || 0}
                        format="number"
                        hint={`${providers.data[0]?.provider || "N/A"}`}
                    />
                    <ComparisonKPI
                        label="Total Provider Cost"
                        value={providers.data.reduce((sum, p) => sum + Number(p.summary.totalCost), 0)}
                        format="currency"
                        hint="Combined spend across all providers"
                    />
                    <Card className="transition-all duration-200 hover:shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Most Reliable
                            </CardTitle>
                            <CardDescription className="text-lg font-bold text-foreground mt-1">
                                {providers.data[0]?.provider || "N/A"}
                            </CardDescription>
                            <div className="text-xs text-muted-foreground mt-1">
                                {providers.data[0]?.usagePercentage.toFixed(1) || 0}% of total usage
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            ) : null}

            {/* Provider Analytics Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cloud className="h-5 w-5" />
                        Provider Performance Analytics
                    </CardTitle>
                    <CardDescription>Comprehensive analysis of your AI provider usage</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
                            <TabsTrigger value="performance">Performance</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            {providers.isLoading ? (
                                <Skeleton className="h-[400px] w-full" />
                            ) : providers.isError ? (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    <div className="text-center">
                                        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p>Failed to load provider overview</p>
                                    </div>
                                </div>
                            ) : providers.data && providers.data.length > 0 ? (
                                <ProviderOverviewChart data={providers.data} />
                            ) : (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    No provider data available
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="cost" className="space-y-4">
                            {providers.isLoading ? (
                                <Skeleton className="h-[400px] w-full" />
                            ) : providers.isError ? (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    <div className="text-center">
                                        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p>Failed to load cost data</p>
                                    </div>
                                </div>
                            ) : providers.data && providers.data.length > 0 ? (
                                <ProviderCostChart data={providers.data} />
                            ) : (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    No cost data available
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="performance" className="space-y-4">
                            {providers.isLoading ? (
                                <Skeleton className="h-[400px] w-full" />
                            ) : providers.isError ? (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    <div className="text-center">
                                        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p>Failed to load performance data</p>
                                    </div>
                                </div>
                            ) : providers.data && providers.data.length > 0 ? (
                                <ProviderPerformanceChart data={providers.data} />
                            ) : (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    No performance data available
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Provider Cards Grid */}
            {providers.data && providers.data.length > 0 && (
                <div className="grid gap-4 @[60rem]:grid-cols-2 @[90rem]:grid-cols-3">
                    {providers.data.map((provider) => (
                        <ProviderCard key={provider.provider} provider={provider} />
                    ))}
                </div>
            )}

            {/* Quota Warnings */}
            {providers.data && providers.data.some(p => p.quotaUsagePercentage > 80) && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Quota Warning:</strong> Some providers are approaching their usage limits. Consider upgrading your plans or switching providers.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}

// Enhanced Provider Card
function ProviderCard({ provider }: { provider: MetricsByProvider }) {
    const isQuotaWarning = provider.quotaUsagePercentage > 80
    const isQuotaCritical = provider.quotaUsagePercentage > 95

    return (
        <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
            isQuotaCritical ? 'border-red-200 dark:border-red-800' :
            isQuotaWarning ? 'border-yellow-200 dark:border-yellow-800' : ''
        }`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        {provider.provider}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {provider.modelCount} models
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="text-muted-foreground">Requests</div>
                        <div className="text-lg font-semibold text-primary">
                            {provider.summary.totalRequests.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">Cost</div>
                        <div className="text-lg font-semibold text-chart-2">
                            ${Number(provider.summary.totalCost).toFixed(4)}
                        </div>
                    </div>
                </div>

                {/* Usage percentage visualization */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Usage Share</span>
                        <span>{provider.usagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress
                        value={provider.usagePercentage}
                        className="h-2"
                    />
                </div>

                {/* Quota information if available */}
                {provider.quotaLimit && provider.quotaUsed && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Quota Used</span>
                            <span className={isQuotaCritical ? 'text-red-600 font-medium' :
                                           isQuotaWarning ? 'text-yellow-600 font-medium' : ''}>
                                {provider.quotaUsagePercentage.toFixed(1)}%
                            </span>
                        </div>
                        <Progress
                            value={provider.quotaUsagePercentage}
                            className={`h-2 ${
                                isQuotaCritical ? '[&>div]:bg-red-500' :
                                isQuotaWarning ? '[&>div]:bg-yellow-500' : ''
                            }`}
                        />
                        <div className="text-xs text-muted-foreground">
                            {provider.quotaUsed.toLocaleString()} / {provider.quotaLimit.toLocaleString()} units
                        </div>
                        {isQuotaWarning && (
                            <div className={`text-xs flex items-center gap-1 ${
                                isQuotaCritical ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                                {isQuotaCritical ? (
                                    <AlertTriangle className="h-3 w-3" />
                                ) : (
                                    <AlertCircle className="h-3 w-3" />
                                )}
                                {isQuotaCritical ? 'Critical: Upgrade needed' : 'Warning: Approaching limit'}
                            </div>
                        )}
                    </div>
                )}

                {/* Cost per request */}
                <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-1">Cost Efficiency</div>
                    <div className="text-sm font-medium">
                        ${(provider.summary.totalCost / Math.max(1, provider.summary.totalRequests)).toFixed(6)}/request
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Provider Overview Chart - Usage distribution
function ProviderOverviewChart({ data }: { data: MetricsByProvider[] }) {
    const chartData = data.map(provider => ({
        provider: provider.provider,
        requests: provider.summary.totalRequests,
        cost: Number(provider.summary.totalCost),
        percentage: provider.usagePercentage,
        models: provider.modelCount
    }))

    const config: ChartConfig = {
        requests: {
            label: "Requests",
            color: "var(--chart-1)",
        },
        cost: {
            label: "Cost ($)",
            color: "var(--chart-2)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass(400)}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                    dataKey="provider"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                />
                <YAxis
                    yAxisId="left"
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                                <div className="rounded-lg border bg-background p-4 shadow-sm">
                                    <div className="font-medium mb-2">{label}</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Requests:</span>
                                            <span className="font-medium">{data.requests.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Cost:</span>
                                            <span className="font-medium">${data.cost.toFixed(4)}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Usage:</span>
                                            <span className="font-medium">{data.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Models:</span>
                                            <span className="font-medium">{data.models}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                    yAxisId="left"
                    dataKey="requests"
                    fill="var(--color-requests)"
                    radius={[2, 2, 0, 0]}
                    name="Requests"
                />
                <Bar
                    yAxisId="right"
                    dataKey="cost"
                    fill="var(--color-cost)"
                    radius={[2, 2, 0, 0]}
                    name="Cost ($)"
                />
            </BarChart>
        </ChartContainer>
    )
}

// Provider Cost Chart - Cost distribution pie
function ProviderCostChart({ data }: { data: MetricsByProvider[] }) {
    const chartData = data.map(provider => ({
        name: provider.provider,
        value: Number(provider.summary.totalCost),
        percentage: data.length > 0 ?
            (Number(provider.summary.totalCost) / data.reduce((sum, p) => sum + Number(p.summary.totalCost), 0)) * 100 : 0,
        fill: `var(--chart-${(data.indexOf(provider) % 5) + 1})`
    }))

    const config: ChartConfig = {
        value: {
            label: "Cost ($)",
            color: "var(--chart-1)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass(400)}>
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                                <div className="rounded-lg border bg-background p-3 shadow-sm">
                                    <div className="font-medium">{data.name}</div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <div className="text-xs text-muted-foreground">Cost</div>
                                            <div className="font-medium">${data.value.toFixed(4)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Percentage</div>
                                            <div className="font-medium">{data.percentage.toFixed(1)}%</div>
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
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, percentage }) =>
                        percentage > 5 ? `${name}: ${percentage.toFixed(1)}%` : ''
                    }
                    labelLine={false}
                />
                <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
        </ChartContainer>
    )
}

// Provider Performance Chart - Radar chart for multi-dimensional analysis
function ProviderPerformanceChart({ data }: { data: MetricsByProvider[] }) {
    const maxRequests = Math.max(...data.map(p => p.summary.totalRequests))
    const maxCost = Math.max(...data.map(p => Number(p.summary.totalCost)))

    const chartData = data.map(provider => ({
        provider: provider.provider,
        requests: (provider.summary.totalRequests / maxRequests) * 100,
        cost: (Number(provider.summary.totalCost) / maxCost) * 100,
        efficiency: provider.summary.totalRequests > 0 ?
            (provider.summary.totalRequests / Number(provider.summary.totalCost)) / 1000 : 0,
        models: provider.modelCount
    }))

    const config: ChartConfig = {
        requests: {
            label: "Requests",
            color: "var(--chart-1)",
        },
        cost: {
            label: "Cost",
            color: "var(--chart-2)",
        },
        efficiency: {
            label: "Efficiency",
            color: "var(--chart-3)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass(400)}>
            <RadarChart data={chartData}>
                <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                                <div className="rounded-lg border bg-background p-3 shadow-sm">
                                    <div className="font-medium mb-2">{label}</div>
                                    <div className="space-y-1 text-sm">
                                        <div>Requests: {(data.requests).toFixed(1)}% of max</div>
                                        <div>Cost: {(data.cost).toFixed(1)}% of max</div>
                                        <div>Efficiency: {data.efficiency.toFixed(2)} req/$1K</div>
                                        <div>Models: {data.models}</div>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <PolarGrid />
                <PolarAngleAxis dataKey="provider" />
                <Radar
                    name="Requests"
                    dataKey="requests"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                />
                <Radar
                    name="Cost"
                    dataKey="cost"
                    stroke="var(--chart-2)"
                    fill="var(--chart-2)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                />
                <Radar
                    name="Efficiency"
                    dataKey="efficiency"
                    stroke="var(--chart-3)"
                    fill="var(--chart-3)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                />
                <ChartLegend content={<ChartLegendContent />} />
            </RadarChart>
        </ChartContainer>
    )
}

export default memo(ProvidersSection)

