"use client"

import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    MessageSquare,
    Clock,
    DollarSign,
    Target,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    ImageIcon,
    Wrench
} from "lucide-react"
import type { ConversationAnalytics } from "../types"

interface ConversationKPICardProps {
    conversation: ConversationAnalytics
    showDetails?: boolean
}

function ConversationKPICard({ conversation, showDetails = false }: ConversationKPICardProps) {
    const { completionMetrics, engagementMetrics, qualityMetrics, costMetrics } = conversation

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate text-lg">
                                {conversation.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    {conversation.provider}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    {new Date(conversation.createdAt).toLocaleDateString()}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                            {qualityMetrics.hasErrors && (
                                <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Error
                                </Badge>
                            )}
                            {qualityMetrics.hasImages && (
                                <Badge variant="secondary" className="text-xs">
                                    <ImageIcon className="h-3 w-3 mr-1" />
                                    Images
                                </Badge>
                            )}
                            {qualityMetrics.hasToolCalls && (
                                <Badge variant="outline" className="text-xs">
                                    <Wrench className="h-3 w-3 mr-1" />
                                    Tools
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                        {/* Completion Rate */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Target className="h-4 w-4" />
                                Completion
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-semibold">
                                    {Math.round(completionMetrics.completionRate * 100)}%
                                </div>
                                {completionMetrics.isCompleted ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {completionMetrics.userMessages} user, {completionMetrics.assistantMessages} assistant
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                Duration
                            </div>
                            <div className="text-2xl font-semibold">
                                {formatDuration(engagementMetrics.duration)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {engagementMetrics.messageFrequency} msg/min
                            </div>
                        </div>

                        {/* Cost */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                Cost
                            </div>
                            <div className="text-2xl font-semibold">
                                ${costMetrics.totalCost.toFixed(4)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                ${costMetrics.costPerToken.toFixed(6)}/token
                            </div>
                        </div>

                        {/* Quality Score */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MessageSquare className="h-4 w-4" />
                                Quality
                            </div>
                            <div className="text-2xl font-semibold">
                                {Math.round(engagementMetrics.sessionLengthScore * 100)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Engagement score
                            </div>
                        </div>
                    </div>

                    {/* Additional Details */}
                    {showDetails && (
                        <div className="pt-4 border-t">
                            <div className="grid gap-4 @[48rem]:grid-cols-3">
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Message Length</div>
                                    <div className="font-medium">
                                        {Math.round(qualityMetrics.averageMessageLength)} chars avg
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Total Tokens</div>
                                    <div className="font-medium">
                                        {qualityMetrics.totalTokensUsed.toLocaleString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Response Time</div>
                                    <div className="font-medium">
                                        {formatDuration(engagementMetrics.averageResponseTime)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// Helper function to format duration strings
function formatDuration(duration: string): string {
    try {
        // Handle different duration formats
        if (duration.includes('PT')) {
            // ISO 8601 duration format (PT1H30M45S)
            const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
            if (match) {
                const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0
                const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0
                const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0

                if (hours > 0) return `${hours}h ${minutes}m`
                if (minutes > 0) return `${minutes}m ${seconds}s`
                return `${seconds}s`
            }
        }

        // If it's already a formatted string, return as is
        return duration
    } catch {
        return duration
    }
}

export default memo(ConversationKPICard)
