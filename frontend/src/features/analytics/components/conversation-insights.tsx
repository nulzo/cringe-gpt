"use client"

import { memo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig
} from "@/components/ui/chart"
import {
    Area,
    AreaChart,
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
    Eye,
    TrendingUp,
    Clock,
    DollarSign,
    MessageSquare,
    AlertCircle,
    Target,
    Zap,
    Calendar,
    BarChart3
} from "lucide-react"
import { useConversationInsights } from "@/features/analytics/api"
import { useAnalyticsFilters, useAnalyticsTimeRange } from "@/stores/analytics-store"
import { toQueryParams } from "@/features/analytics/utils/params"
import { fillMissingDates, getFullWidthChartClass } from "@/features/analytics/utils/chart-helpers"
import ConversationKPICard from "./conversation-kpi"
import type { ConversationAnalytics } from "../types"

// Color palette for different metrics
const COLORS = {
    completion: "var(--chart-1)",
    duration: "var(--chart-2)",
    cost: "var(--chart-3)",
    messages: "var(--chart-4)",
    engagement: "var(--chart-5)"
}

function ConversationInsights() {
    const [selectedConversation, setSelectedConversation] = useState<ConversationAnalytics | null>(null)
    const timeRange = useAnalyticsTimeRange()
    const filters = useAnalyticsFilters()

    const params = toQueryParams(timeRange, filters.groupBy)
    const insights = useConversationInsights({ ...params, topCount: 10 })

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

    if (insights.isLoading) {
        return <ConversationInsightsSkeleton />
    }

    if (insights.isError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Failed to load conversation insights. Please try again.
                </AlertDescription>
            </Alert>
        )
    }

    if (!insights.data) {
        return (
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                No conversation insights available
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold tracking-tight">Conversation Insights</h3>
                    <p className="text-muted-foreground">
                        Detailed analysis of conversation patterns and performance
                    </p>
                </div>
            </div>

            {/* Pattern Analysis */}
            {insights.data.patterns && insights.data.patterns.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Conversation Patterns Analysis
                        </CardTitle>
                        <CardDescription>
                            Identified patterns in your conversation data ({getTimeRangeLabel()})
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-3">
                            {insights.data.patterns.map((pattern, index) => (
                                <PatternCard
                                    key={pattern.patternType}
                                    pattern={pattern}
                                    color={Object.values(COLORS)[index % Object.values(COLORS).length]}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top vs Recent Conversations */}
            <div className="grid gap-6 @[80rem]:grid-cols-2">
                {/* Top Conversations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Top Conversations
                        </CardTitle>
                        <CardDescription>Most active conversations by message count</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {insights.data.topConversations.slice(0, 5).map((conversation, index) => (
                                <ConversationRow
                                    key={conversation.conversationId}
                                    conversation={conversation}
                                    rank={index + 1}
                                    onClick={() => setSelectedConversation(conversation)}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Conversations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Recent Conversations
                        </CardTitle>
                        <CardDescription>Latest conversation activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {insights.data.recentConversations.slice(0, 5).map((conversation) => (
                                <ConversationRow
                                    key={conversation.conversationId}
                                    conversation={conversation}
                                    showDate={true}
                                    onClick={() => setSelectedConversation(conversation)}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Conversation Detail Modal/View */}
            {selectedConversation && (
                <ConversationDetailView
                    conversation={selectedConversation}
                    onClose={() => setSelectedConversation(null)}
                />
            )}

            {/* Performance Trends */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Conversation Performance Trends
                    </CardTitle>
                    <CardDescription>
                        Key metrics across your top conversations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {insights.data.topConversations.length > 0 && (
                        <PerformanceTrendsChart conversations={insights.data.topConversations} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// Pattern Card Component
function PatternCard({ pattern, color }: { pattern: any, color: string }) {
    const patternName = pattern.patternType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

    return (
        <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <h4 className="font-medium">{patternName}</h4>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Count:</span>
                    <span className="font-medium">{pattern.conversationCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Duration:</span>
                    <span className="font-medium">{Math.round(pattern.averageDuration)}m</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Cost:</span>
                    <span className="font-medium">${pattern.averageCost.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Messages:</span>
                    <span className="font-medium">{Math.round(pattern.averageMessages)}</span>
                </div>
            </div>
        </div>
    )
}

// Conversation Row Component
function ConversationRow({
    conversation,
    rank,
    showDate = false,
    onClick
}: {
    conversation: ConversationAnalytics
    rank?: number
    showDate?: boolean
    onClick?: () => void
}) {
    return (
        <div
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={onClick}
        >
            <div className="flex items-center gap-3">
                {rank && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {rank}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="font-medium truncate max-w-[200px]">
                        {conversation.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {conversation.provider} • {conversation.completionMetrics.totalMessages} messages
                        {showDate && (
                            <span className="ml-2">
                                • {new Date(conversation.createdAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="font-medium">
                        ${conversation.costMetrics.totalCost.toFixed(4)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {Math.round(conversation.completionMetrics.completionRate * 100)}% completion
                    </div>
                </div>

                <div className="flex gap-1">
                    {conversation.qualityMetrics.hasErrors && (
                        <Badge variant="destructive" className="text-xs">Error</Badge>
                    )}
                    {conversation.qualityMetrics.hasImages && (
                        <Badge variant="secondary" className="text-xs">Images</Badge>
                    )}
                    {conversation.qualityMetrics.hasToolCalls && (
                        <Badge variant="outline" className="text-xs">Tools</Badge>
                    )}
                </div>
            </div>
        </div>
    )
}

// Conversation Detail View Component
function ConversationDetailView({
    conversation,
    onClose
}: {
    conversation: ConversationAnalytics
    onClose: () => void
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{conversation.title}</CardTitle>
                        <CardDescription>
                            Conversation #{conversation.conversationId} • {conversation.provider}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ConversationKPICard conversation={conversation} showDetails={true} />
            </CardContent>
        </Card>
    )
}

// Performance Trends Chart
function PerformanceTrendsChart({ conversations }: { conversations: ConversationAnalytics[] }) {
    const data = conversations.map((conv, index) => ({
        name: `Conv ${index + 1}`,
        completionRate: Math.round(conv.completionMetrics.completionRate * 100),
        cost: conv.costMetrics.totalCost,
        duration: parseDuration(conv.engagementMetrics.duration),
        messages: conv.completionMetrics.totalMessages
    }))

    const config: ChartConfig = {
        completionRate: {
            label: "Completion Rate (%)",
            color: COLORS.completion,
        },
        cost: {
            label: "Cost ($)",
            color: COLORS.cost,
        },
        messages: {
            label: "Messages",
            color: COLORS.messages,
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass()}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} width={50} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} width={60} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                />
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="completionRate"
                    stroke={COLORS.completion}
                    strokeWidth={2}
                    name="Completion Rate (%)"
                />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cost"
                    stroke={COLORS.cost}
                    strokeWidth={2}
                    name="Cost ($)"
                />
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="messages"
                    stroke={COLORS.messages}
                    strokeWidth={2}
                    name="Messages"
                />
            </LineChart>
        </ChartContainer>
    )
}

// Loading skeleton
function ConversationInsightsSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                ))}
            </div>
            <div className="grid gap-6 @[80rem]:grid-cols-2">
                <Skeleton className="h-[300px]" />
                <Skeleton className="h-[300px]" />
            </div>
        </div>
    )
}

// Helper functions
function formatDuration(duration: string): string {
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

function parseDuration(duration: string): number {
    try {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
        if (match) {
            const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0
            const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0
            return hours * 60 + minutes
        }
    } catch {
        // Fallback
    }
    return 0
}

export default memo(ConversationInsights)
