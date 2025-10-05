"use client"

import { memo, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnalyticsFilters, useAnalyticsTimeRange } from "@/stores/analytics-store"
import { useModelsAnalytics } from "@/features/analytics/api/get-models-analytics"
import { toQueryParams } from "@/features/analytics/utils/params"
import { fillMissingDates, getFullWidthChartClass } from "@/features/analytics/utils/chart-helpers"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig
} from "@/components/ui/chart"
import { ComparisonKPI } from "./kpi"
import { Brain, TrendingUp, DollarSign, Activity, Zap, RefreshCw, AlertCircle, Trophy, Target } from "lucide-react"
import type { MetricsByModel } from "../types"

function ModelsSection() {
    const timeRange = useAnalyticsTimeRange()
    const filters = useAnalyticsFilters()
    const [activeTab, setActiveTab] = useState("overview")

    const params = useMemo(() => ({ ...toQueryParams(timeRange, filters.groupBy), limit: 20 as number }), [timeRange, filters.groupBy])
    const models = useModelsAnalytics(params)

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
            {/* Model KPIs */}
            {models.isLoading ? (
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
            ) : models.isError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>Failed to load model analytics data.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => models.refetch()}
                            className="ml-2"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : models.data && models.data.length > 0 ? (
                <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                    <ComparisonKPI
                        label="Total Models Used"
                        value={models.data.length}
                        format="number"
                        hint="Different models accessed"
                    />
                    <ComparisonKPI
                        label="Top Model Requests"
                        value={models.data[0]?.summary.totalRequests || 0}
                        format="number"
                        hint={`${models.data[0]?.model || "N/A"} (${models.data[0]?.provider || ""})`}
                    />
                    <ComparisonKPI
                        label="Avg Cost/Model"
                        value={models.data.length > 0 ?
                            models.data.reduce((sum, m) => sum + Number(m.summary.totalCost), 0) / models.data.length : 0}
                        format="currency"
                        hint="Average spend per model"
                    />
                    <Card className="transition-all duration-200 hover:shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Trophy className="h-4 w-4" />
                                Most Popular
                            </CardTitle>
                            <CardDescription className="text-lg font-bold text-foreground mt-1">
                                {models.data[0]?.model || "N/A"}
                            </CardDescription>
                            <div className="text-xs text-muted-foreground mt-1">
                                {models.data[0]?.provider || "No provider"} • {models.data[0]?.summary.totalRequests || 0} requests
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            ) : null}

            {/* Model Analytics Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Model Performance Analytics
                    </CardTitle>
                    <CardDescription>Comprehensive analysis of your AI model usage</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="performance">Performance</TabsTrigger>
                            <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            {models.isLoading ? (
                                <Skeleton className="h-[400px] w-full" />
                            ) : models.isError ? (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    <div className="text-center">
                                        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p>Failed to load model overview</p>
                                    </div>
                                </div>
                            ) : models.data && models.data.length > 0 ? (
                                <ModelOverviewChart data={models.data.slice(0, 10)} />
                            ) : (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    No model data available
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="performance" className="space-y-4">
                            {models.isLoading ? (
                                <Skeleton className="h-[400px] w-full" />
                            ) : models.isError ? (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    <div className="text-center">
                                        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p>Failed to load performance data</p>
                                    </div>
                                </div>
                            ) : models.data && models.data.length > 0 ? (
                                <ModelPerformanceChart data={models.data.slice(0, 8)} />
                            ) : (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    No performance data available
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="cost" className="space-y-4">
                            {models.isLoading ? (
                                <Skeleton className="h-[400px] w-full" />
                            ) : models.isError ? (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    <div className="text-center">
                                        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p>Failed to load cost data</p>
                                    </div>
                                </div>
                            ) : models.data && models.data.length > 0 ? (
                                <ModelCostChart data={models.data.slice(0, 10)} />
                            ) : (
                                <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                                    No cost data available
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Model Comparison Table */}
            {models.data && models.data.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Model Comparison
                        </CardTitle>
                        <CardDescription>Detailed breakdown of your top models</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {models.data.slice(0, 5).map((model, index) => (
                                <div key={`${model.provider}-${model.model}`} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                            <span className="text-sm font-medium text-primary">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-medium">{model.model}</div>
                                            <div className="text-sm text-muted-foreground">{model.provider}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6 text-right">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Requests</div>
                                            <div className="font-medium">{model.summary.totalRequests.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Tokens</div>
                                            <div className="font-medium">{(model.summary.totalPromptTokens + model.summary.totalCompletionTokens).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Cost</div>
                                            <div className="font-medium">${Number(model.summary.totalCost).toFixed(4)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// Model Overview Chart - Requests and Cost
function ModelOverviewChart({ data }: { data: MetricsByModel[] }) {
    const chartData = data.map(model => ({
        name: model.model.length > 15 ? model.model.substring(0, 15) + "..." : model.model,
        fullName: `${model.provider}/${model.model}`,
        requests: model.summary.totalRequests,
        cost: Number(model.summary.totalCost),
        tokens: model.summary.totalPromptTokens + model.summary.totalCompletionTokens,
        provider: model.provider
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
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    angle={-45}
                    textAnchor="end"
                    height={80}
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
                                    <div className="font-medium mb-2">{data.fullName}</div>
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
                                            <span className="text-muted-foreground">Tokens:</span>
                                            <span className="font-medium">{data.tokens.toLocaleString()}</span>
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

// Model Performance Chart - Efficiency metrics
function ModelPerformanceChart({ data }: { data: MetricsByModel[] }) {
    const chartData = data.map(model => ({
        name: model.model.length > 12 ? model.model.substring(0, 12) + "..." : model.model,
        fullName: model.model,
        efficiency: model.summary.totalRequests > 0 ?
            (model.summary.totalPromptTokens + model.summary.totalCompletionTokens) / model.summary.totalRequests : 0,
        avgTokens: model.summary.totalRequests > 0 ?
            (model.summary.totalPromptTokens + model.summary.totalCompletionTokens) / model.summary.totalRequests : 0,
        requests: model.summary.totalRequests,
        provider: model.provider
    }))

    const config: ChartConfig = {
        efficiency: {
            label: "Tokens/Request",
            color: "var(--chart-1)",
        },
        requests: {
            label: "Total Requests",
            color: "var(--chart-2)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass(400)}>
            <ScatterChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                    type="number"
                    dataKey="efficiency"
                    name="Tokens per Request"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toFixed(0)}
                />
                <YAxis
                    type="number"
                    dataKey="requests"
                    name="Total Requests"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                />
                <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                                <div className="rounded-lg border bg-background p-3 shadow-sm">
                                    <div className="font-medium">{data.fullName}</div>
                                    <div className="text-sm text-muted-foreground">{data.provider}</div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <div className="text-xs text-muted-foreground">Tokens/Request</div>
                                            <div className="font-medium">{data.efficiency.toFixed(1)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Total Requests</div>
                                            <div className="font-medium">{data.requests.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Scatter
                    name="Models"
                    dataKey="requests"
                    fill="var(--color-chart-1)"
                />
            </ScatterChart>
        </ChartContainer>
    )
}

// Model Cost Chart - Cost distribution
function ModelCostChart({ data }: { data: MetricsByModel[] }) {
    const totalCost = data.reduce((sum, model) => sum + Number(model.summary.totalCost), 0)
    const chartData = data.map(model => ({
        name: model.model.length > 15 ? model.model.substring(0, 15) + "..." : model.model,
        fullName: model.model,
        cost: Number(model.summary.totalCost),
        percentage: totalCost > 0 ? (Number(model.summary.totalCost) / totalCost) * 100 : 0,
        requests: model.summary.totalRequests,
        provider: model.provider,
        fill: `var(--chart-${(data.indexOf(model) % 5) + 1})`
    }))

    const config: ChartConfig = {
        cost: {
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
                                    <div className="font-medium">{data.fullName}</div>
                                    <div className="text-sm text-muted-foreground">{data.provider}</div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <div className="text-xs text-muted-foreground">Cost</div>
                                            <div className="font-medium">${data.cost.toFixed(4)}</div>
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
                    dataKey="cost"
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

export default memo(ModelsSection)

