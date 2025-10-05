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
import {
    Bar,
    BarChart,
    Line,
    LineChart,
    Pie,
    PieChart,
    Cell,
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis
} from "recharts"
import {
    MessageSquare,
    Clock,
    DollarSign,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    AlertCircle,
    Users,
    Target,
    Zap,
    BarChart3
} from "lucide-react"
import { KPI, KPISkeleton } from "./kpi"
import { useAnalyticsFilters, useAnalyticsTimeRange } from "@/stores/analytics-store"
import {
    useConversationAnalyticsSummary,
    useConversationPatterns,
    useConversationInsights
} from "@/features/analytics/api"
import { toQueryParams } from "@/features/analytics/utils/params"
import { fillMissingDates, getFullWidthChartClass } from "@/features/analytics/utils/chart-helpers"
import type {
    ConversationAnalyticsSummary,
    ConversationPattern,
    ConversationPatternData,
    ConversationChartData
} from "../types"

// Color palette for patterns
const PATTERN_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)"
]

function ConversationSection() {
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

    const params = useMemo(() => toQueryParams(timeRange, filters.groupBy), [timeRange, filters.groupBy])

    const summary = useConversationAnalyticsSummary(params)
    const patterns = useConversationPatterns(params)
    const insights = useConversationInsights({ ...params, topCount: 10 })

    // Process pattern data for charts
    const patternChartData = useMemo(() => {
        if (!patterns.data || !summary.data) return []

        const totalConversations = summary.data.totalConversations
        return patterns.data.map((pattern, index) => ({
            pattern: pattern.patternType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            count: pattern.conversationCount,
            percentage: totalConversations > 0 ? (pattern.conversationCount / totalConversations) * 100 : 0,
            avgCost: pattern.averageCost,
            avgMessages: pattern.averageMessages,
            color: PATTERN_COLORS[index % PATTERN_COLORS.length]
        })) as ConversationPatternData[]
    }, [patterns.data, summary.data])

    // Process provider distribution data
    const providerChartData = useMemo(() => {
        if (!summary.data?.conversationsByProvider) return []

        return Object.entries(summary.data.conversationsByProvider).map(([provider, count]) => ({
            provider,
            conversations: count,
            percentage: summary.data.totalConversations > 0 ? (count / summary.data.totalConversations) * 100 : 0
        }))
    }, [summary.data])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Conversation Analytics</h2>
                    <p className="text-muted-foreground">
                        Insights into conversation patterns, engagement, and quality metrics
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        summary.refetch()
                        patterns.refetch()
                        insights.refetch()
                    }}
                    disabled={summary.isLoading || patterns.isLoading || insights.isLoading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${summary.isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Conversation KPIs */}
            {summary.isLoading ? (
                <KPISkeleton />
            ) : summary.isError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>Failed to load conversation analytics. Please try again.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => summary.refetch()}
                            className="ml-2"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : summary.data ? (
                <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                    <KPI
                        label="Total Conversations"
                        value={summary.data.totalConversations.toLocaleString()}
                        hint={`${Math.round(summary.data.averageMessagesPerConversation)} avg messages`}
                        trend="up"
                        icon="MessageSquare"
                    />
                    <KPI
                        label="Completion Rate"
                        value={`${Math.round(summary.data.averageCompletionRate * 100)}%`}
                        hint={`${summary.data.conversationsWithErrors} with errors`}
                        trend={summary.data.averageCompletionRate > 0.8 ? "up" : "down"}
                        icon="Target"
                    />
                    <KPI
                        label="Avg. Duration"
                        value={formatDuration(summary.data.averageConversationDuration)}
                        hint={`${Math.round(summary.data.averageEngagementScore * 100)}% engagement`}
                        trend="neutral"
                        icon="Clock"
                    />
                    <KPI
                        label="Total Cost"
                        value={`$${summary.data.totalCostAcrossAllConversations.toFixed(2)}`}
                        hint={`${summary.data.conversationsWithImages} with images`}
                        trend={summary.data.totalCostAcrossAllConversations > 0 ? "up" : "neutral"}
                        icon="DollarSign"
                    />
                </div>
            ) : null}

            {/* Main Charts Grid */}
            <div className="grid gap-6 @[80rem]:grid-cols-2">
                {/* Provider Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Conversations by Provider ({getTimeRangeLabel()})
                        </CardTitle>
                        <CardDescription>Distribution of conversations across different AI providers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {summary.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : summary.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load provider data</p>
                                </div>
                            </div>
                        ) : providerChartData.length > 0 ? (
                            <ProviderDistributionChart data={providerChartData} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No provider data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Conversation Patterns */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Conversation Patterns ({getTimeRangeLabel()})
                        </CardTitle>
                        <CardDescription>Identified patterns in conversation behavior</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {patterns.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : patterns.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load pattern data</p>
                                </div>
                            </div>
                        ) : patternChartData.length > 0 ? (
                            <PatternAnalysisChart data={patternChartData} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No patterns identified
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quality Metrics */}
            {summary.data && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Conversation Quality Metrics
                        </CardTitle>
                        <CardDescription>Overall quality indicators for your conversations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Error Rate</div>
                                <div className="text-2xl font-semibold text-red-600">
                                    {Math.round(summary.data.errorRate * 100)}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {summary.data.conversationsWithErrors} conversations affected
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Conversations with Images</div>
                                <div className="text-2xl font-semibold text-blue-600">
                                    {summary.data.conversationsWithImages}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {summary.data.totalConversations > 0
                                        ? `${Math.round((summary.data.conversationsWithImages / summary.data.totalConversations) * 100)}% of total`
                                        : '0%'
                                    }
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Conversations with Tools</div>
                                <div className="text-2xl font-semibold text-purple-600">
                                    {summary.data.conversationsWithToolCalls}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {summary.data.totalConversations > 0
                                        ? `${Math.round((summary.data.conversationsWithToolCalls / summary.data.totalConversations) * 100)}% of total`
                                        : '0%'
                                    }
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Engagement Score</div>
                                <div className="text-2xl font-semibold text-green-600">
                                    {Math.round(summary.data.averageEngagementScore * 100)}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Average across all conversations
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top Conversations Table */}
            {insights.data?.topConversations && insights.data.topConversations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Top Conversations by Message Count
                        </CardTitle>
                        <CardDescription>Your most active conversations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {insights.data.topConversations.slice(0, 5).map((conversation, index) => (
                                <div key={conversation.conversationId} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium truncate max-w-[200px]">
                                                {conversation.title}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {conversation.provider} • {conversation.completionMetrics.totalMessages} messages
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">
                                            ${conversation.costMetrics.totalCost.toFixed(4)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {Math.round(conversation.completionMetrics.completionRate * 100)}% completion
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

// Provider Distribution Chart
function ProviderDistributionChart({ data }: { data: any[] }) {
    const config: ChartConfig = {
        conversations: {
            label: "Conversations",
            color: "var(--chart-1)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass()}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                    dataKey="provider"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                />
                <YAxis axisLine={false} tickLine={false} width={50} />
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            formatter={(value, name) => [
                                `${value} conversations`,
                                "Count"
                            ]}
                        />
                    }
                />
                <Bar
                    dataKey="conversations"
                    fill="var(--color-conversations)"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ChartContainer>
    )
}

// Pattern Analysis Chart
function PatternAnalysisChart({ data }: { data: ConversationPatternData[] }) {
    return (
        <div className="space-y-4">
            {data.map((pattern, index) => (
                <div key={pattern.pattern} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: pattern.color }}
                        />
                        <div>
                            <div className="font-medium">{pattern.pattern}</div>
                            <div className="text-sm text-muted-foreground">
                                {pattern.count} conversations ({pattern.percentage.toFixed(1)}%)
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-medium">${pattern.avgCost.toFixed(4)}</div>
                        <div className="text-sm text-muted-foreground">
                            {Math.round(pattern.avgMessages)} avg messages
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

// Helper function to format duration
function formatDuration(duration: string): string {
    // This is a simple formatter - you might want to use a proper duration library
    try {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
        if (match) {
            const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0
            const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0
            const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0

            if (hours > 0) return `${hours}h ${minutes}m`
            if (minutes > 0) return `${minutes}m ${seconds}s`
            return `${seconds}s`
        }
    } catch {
        // Fallback
    }
    return duration
}

export default memo(ConversationSection)
