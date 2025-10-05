"use client"

import { memo, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAnalyticsFilters, useAnalyticsTimeRange } from "@/stores/analytics-store"
import { useTimeSeriesMetrics } from "@/features/analytics/api/get-time-series"
import { useUsageHabits } from "@/features/analytics/api/get-usage-habits"
import { useUsageTrends } from "@/features/analytics/api/get-trends"
import { toQueryParams } from "@/features/analytics/utils/params"
import { fillMissingDates, getFullWidthChartClass } from "@/features/analytics/utils/chart-helpers"
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig
} from "@/components/ui/chart"
import { ComparisonKPI } from "./kpi"
import { Activity, Clock, Calendar, TrendingUp, Users, BarChart3, PieChart as PieChartIcon, RefreshCw, AlertCircle, Flame } from "lucide-react"

function UsageSection() {
    const timeRange = useAnalyticsTimeRange()
    const filters = useAnalyticsFilters()
    const params = useMemo(() => toQueryParams(timeRange, filters.groupBy), [timeRange, filters.groupBy])

    const series = useTimeSeriesMetrics(params)
    const habits = useUsageHabits(params)
    const usageTrends = useUsageTrends(params)

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
            {/* Usage KPIs */}
            {series.isLoading ? (
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
            ) : series.isError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>Failed to load usage analytics data.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => series.refetch()}
                            className="ml-2"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : series.data && series.data.length > 0 ? (
                <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
                    <ComparisonKPI
                        label="Total Requests"
                        value={series.data.reduce((sum, item) => sum + item.requests, 0)}
                        format="number"
                        hint="Total API requests"
                    />
                    <ComparisonKPI
                        label="Avg Daily Requests"
                        value={Math.round(series.data.reduce((sum, item) => sum + item.requests, 0) / series.data.length)}
                        format="number"
                        hint="Requests per day"
                    />
                    <ComparisonKPI
                        label="Total Tokens"
                        value={series.data.reduce((sum, item) => sum + item.promptTokens + item.completionTokens, 0)}
                        format="number"
                        hint="Prompt + completion tokens"
                    />
                    <ComparisonKPI
                        label="Peak Day"
                        value={Math.max(...series.data.map(item => item.requests))}
                        format="number"
                        hint="Highest daily requests"
                    />
                </div>
            ) : null}

            {/* Usage Charts */}
            <div className="grid gap-6 @[80rem]:grid-cols-2">
                {/* Request Volume Over Time */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Request Volume
                        </CardTitle>
                        <CardDescription>API requests over the selected time period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {series.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : series.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load request data</p>
                                </div>
                            </div>
                        ) : series.data && series.data.length > 0 ? (
                            <RequestVolumeChart data={series.data} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No request data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Usage Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Usage Trends ({getTimeRangeLabel()})
                        </CardTitle>
                        <CardDescription>{getGroupingLabel()} request patterns and trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {usageTrends.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : usageTrends.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load trend data</p>
                                </div>
                            </div>
                        ) : usageTrends.data && Object.keys(usageTrends.data).length > 0 ? (
                            <UsageTrendsChart data={usageTrends.data} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No trend data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Usage Patterns */}
            <div className="grid gap-6 @[80rem]:grid-cols-2">
                {/* Usage Habits */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Usage Patterns
                        </CardTitle>
                        <CardDescription>Your AI usage habits and patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {habits.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : habits.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load usage habits</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => habits.refetch()}
                                        className="mt-2"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Retry
                                    </Button>
                                </div>
                            </div>
                        ) : habits.data ? (
                            <UsageHabitsGrid data={habits.data} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No usage habits data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Hourly Distribution */}
            <Card>
                <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Hourly Activity
                        </CardTitle>
                        <CardDescription>Request distribution by hour of day</CardDescription>
                </CardHeader>
                <CardContent>
                        {series.isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : series.isError ? (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p>Failed to load hourly data</p>
                                </div>
                            </div>
                        ) : series.data && series.data.length > 0 ? (
                            <HourlyActivityChart data={series.data} />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                No hourly data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Usage Insights */}
            {habits.data && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Usage Insights
                        </CardTitle>
                        <CardDescription>Analysis of your AI usage patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 @[48rem]:grid-cols-2 @[80rem]:grid-cols-3">
                            {/* Peak Hour Analysis */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        Peak Activity
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-2xl font-bold">
                                        {habits.data.peakHour}:00
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Most active hour
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {habits.data.peakHour >= 6 && habits.data.peakHour < 12 ? "Morning activity" :
                                     habits.data.peakHour >= 12 && habits.data.peakHour < 18 ? "Afternoon activity" :
                                     habits.data.peakHour >= 18 && habits.data.peakHour < 22 ? "Evening activity" :
                                     "Night activity"}
                                </div>
                            </div>

                            {/* Session Analysis */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        Session Length
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-2xl font-bold">
                                        {Math.round(habits.data.averageSessionLength || 0)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Average session length
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {Math.round(habits.data.averageRequestsPerSession || 0)} requests per session
                                </div>
                            </div>

                            {/* Day Analysis */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Most Active
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-2xl font-bold">
                                        {habits.data.mostActiveDay || "N/A"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Busiest day of week
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Favorite: {habits.data.mostUsedModel || "N/A"}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Activity Heatmap */}
            <ActivityHeatmap data={series.data || []} />
        </div>
    )
}

// Enhanced Request Volume Chart
function RequestVolumeChart({ data }: { data: any[] }) {
    // Fill missing dates with 0 values
    const filledData = fillMissingDates(data);

    const config: ChartConfig = {
                                requests: {
                                    label: "Requests",
            color: "var(--chart-1)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass()}>
            <AreaChart data={filledData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-requests)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-requests)" stopOpacity={0.05} />
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
                                    <YAxis
                    axisLine={false}
                                        tickLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                                <div className="rounded-lg border bg-background p-3 shadow-sm">
                                    <div className="font-medium">
                                        {new Date(label).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                        })}
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-2">
                                        API Requests
                                    </div>
                                    <div className="font-mono font-medium text-lg">
                                        {data.requests.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {data.promptTokens + data.completionTokens} tokens
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                                    />
                                    <Area
                    type="monotone"
                                        dataKey="requests"
                    stroke="var(--color-requests)"
                                        fill="url(#fillRequests)"
                    strokeWidth={2}
                    name="Requests"
                                    />
                                </AreaChart>
        </ChartContainer>
    )
}

// Usage Trends Chart
function UsageTrendsChart({ data }: { data: Record<string, number> }) {
    const chartData = Object.entries(data)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, requests]) => {
            // Preserve original date format and avoid timezone conversion issues
            const dateObj = new Date(date + (date.includes('T') ? '' : 'T00:00:00'));
            return {
                date,
                requests,
                formattedDate: dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                })
            };
        })

    const config: ChartConfig = {
        requests: {
            label: "Daily Requests",
            color: "var(--chart-1)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass()}>
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
                    tickFormatter={(value) => value.toLocaleString()}
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
                                        {data.requests.toLocaleString()} requests
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="var(--color-requests)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Daily Requests"
                />
            </LineChart>
        </ChartContainer>
    )
}

// Usage Habits Grid
function UsageHabitsGrid({ data }: { data: any }) {
    return (
        <div className="grid gap-4 @[48rem]:grid-cols-2">
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Peak Activity</span>
                    </div>
                    <div className="text-3xl font-bold">{data.peakHour}:00</div>
                    <div className="text-xs text-muted-foreground">
                        Most active hour of the day
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Favorite Day</span>
                    </div>
                    <div className="text-xl font-semibold">{data.mostActiveDay}</div>
                    <div className="text-xs text-muted-foreground">
                        Most productive day
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Session Length</span>
                    </div>
                    <div className="text-3xl font-bold">{Math.round(data.averageSessionLength || 0)}</div>
                    <div className="text-xs text-muted-foreground">
                        Average requests per session
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Preferred Model</span>
                    </div>
                    <div className="text-xl font-semibold">{data.mostUsedModel || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">
                        Most frequently used
                    </div>
                </div>
            </div>
        </div>
    )
}

// Hourly Activity Chart
function HourlyActivityChart({ data }: { data: any[] }) {
    // Group data by hour for the last 24 hours, preserving UTC time
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const hourRequests = data
            .filter(item => {
                // Parse UTC timestamp correctly
                const dateStr = item.date;
                const utcDate = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00Z');
                return utcDate.getUTCHours() === hour;
            })
            .reduce((sum, item) => sum + item.requests, 0)

        return {
            hour: hour.toString().padStart(2, '0') + ':00',
            requests: hourRequests,
            percentage: data.length > 0 ? (hourRequests / data.reduce((sum, item) => sum + item.requests, 0)) * 100 : 0
        }
    })

    const config: ChartConfig = {
        requests: {
            label: "Requests",
            color: "var(--chart-1)",
        },
    }

    return (
        <ChartContainer config={config} className={getFullWidthChartClass()}>
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    interval={2} // Show every 3rd hour
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
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
                                        Requests
                                    </div>
                                    <div className="font-mono font-medium text-lg">
                                        {data.requests.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {data.percentage.toFixed(1)}% of daily total
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Bar
                    dataKey="requests"
                    fill="var(--color-requests)"
                    radius={[2, 2, 0, 0]}
                    name="Hourly Requests"
                />
            </BarChart>
                        </ChartContainer>
    )
}

// GitHub-Style Activity Heatmap
function ActivityHeatmap({ data }: { data: any[] }) {
    // Process data to create a date-based activity map
    const activityMap = new Map<string, number>();
    const maxActivity = { value: 0 };

    // Count activities per day, preserving UTC time
    data.forEach(item => {
        const dateStr = item.date;
        const utcDate = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00Z');
        const date = utcDate.toISOString().split('T')[0];
        const current = activityMap.get(date) || 0;
        const newValue = current + item.requests;
        activityMap.set(date, newValue);
        if (newValue > maxActivity.value) {
            maxActivity.value = newValue;
        }
    });

    // Generate calendar grid for the last 365 days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 1);
    startDate.setDate(startDate.getDate() + 1); // Include today

    const weeks: Array<Array<{ date: Date; activity: number; level: number }>> = [];
    let currentWeek: Array<{ date: Date; activity: number; level: number }> = [];
    let currentDate = new Date(startDate);

    // Calculate first day of week (Sunday)
    const firstDayOfWeek = new Date(currentDate);
    const dayOfWeek = firstDayOfWeek.getDay();
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - dayOfWeek);

    currentDate = new Date(firstDayOfWeek);

    while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const activity = activityMap.get(dateStr) || 0;
        const level = maxActivity.value > 0 ? Math.floor((activity / maxActivity.value) * 4) : 0;

        currentWeek.push({
            date: new Date(currentDate),
            activity,
            level
        });

        // Start new week every 7 days
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add remaining days to last week
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    // Get month labels
    const monthLabels: Array<{ month: string; weekIndex: number }> = [];
    weeks.forEach((week, weekIndex) => {
        if (week.length > 0) {
            const firstDay = week[0];
            const month = firstDay.date.toLocaleDateString('en-US', { month: 'short' });

            // Only add month label if it's the first week of the month
            const prevWeek = weeks[weekIndex - 1];
            if (!prevWeek || prevWeek[prevWeek.length - 1].date.getMonth() !== firstDay.date.getMonth()) {
                monthLabels.push({ month, weekIndex });
            }
        }
    });

    // Activity level colors (GitHub style)
    const getActivityColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-muted/20'; // No activity
            case 1: return 'bg-green-200'; // Light activity
            case 2: return 'bg-green-300'; // Medium activity
            case 3: return 'bg-green-400'; // High activity
            case 4: return 'bg-green-500'; // Very high activity
            default: return 'bg-muted/20';
        }
    };

    return (
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5" />
                    Activity Overview
                </CardTitle>
                <CardDescription>
                    Chat activity over the last year ({maxActivity.value} max requests per day)
                </CardDescription>
                </CardHeader>
            <CardContent className="w-full">
                <div className="space-y-4">
                    {/* Legend */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Less</span>
                        {[0, 1, 2, 3, 4].map(level => (
                            <div
                                key={level}
                                className={`w-3 h-3 rounded-sm ${getActivityColor(level)}`}
                                title={`${level === 0 ? 'No' : level === 1 ? 'Light' : level === 2 ? 'Medium' : level === 3 ? 'High' : 'Very High'} activity`}
                            />
                        ))}
                        <span className="text-muted-foreground ml-2">More</span>
                    </div>

                    {/* Calendar Grid */}
                    <div className="w-full overflow-x-auto">
                        <div className="inline-block w-full min-w-max">
                            {/* Month labels */}
                            <div className="flex mb-2">
                                {monthLabels.map(({ month, weekIndex }) => (
                                    <div
                                        key={`${month}-${weekIndex}`}
                                        className="text-xs text-muted-foreground font-medium"
                                        style={{ width: '12px', marginLeft: `${weekIndex * 12}px` }}
                                    >
                                        {month}
                                    </div>
                                ))}
                            </div>

                            {/* Heatmap grid */}
                            <div className="flex gap-0.5">
                                {/* Day labels (Mon, Wed, Fri) */}
                                <div className="flex flex-col gap-0.5 mr-2">
                                    {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, index) => (
                                        <div key={day} className="text-xs text-muted-foreground h-3 flex items-center">
                                            {day}
                                        </div>
                                    ))}
                            </div>

                                {/* Activity squares */}
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-0.5">
                                        {week.map((day, dayIndex) => (
                                            <div
                                                key={`${weekIndex}-${dayIndex}`}
                                                className={`w-3 h-3 cursor-pointer transition-all hover:ring-1 hover:ring-green-300 ${getActivityColor(day.level)}`}
                                                title={`${day.date.toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}: ${day.activity} ${day.activity === 1 ? 'request' : 'requests'}`}
                                            />
                                        ))}
                            </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                </CardContent>
            </Card>
    );
}

export default memo(UsageSection)

