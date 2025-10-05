import { useCallback, memo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, TrendingUp, RefreshCw } from "lucide-react"
import { useSetTimeRange, useSetFilters, useAnalyticsTimeRange, useAnalyticsFilters, useGetQuickTimeRange, useResetFilters } from "@/stores/analytics-store"

export function Controls() {
    const timeRange = useAnalyticsTimeRange()
    const filters = useAnalyticsFilters()
    const setTimeRange = useSetTimeRange()
    const setFilters = useSetFilters()
    const getQuickTimeRange = useGetQuickTimeRange()
    const resetFilters = useResetFilters()

    const handleTimeRangeChange = useCallback((preset: string) => {
        const range = getQuickTimeRange(preset as any)
        setTimeRange(range)
    }, [getQuickTimeRange, setTimeRange])

    const handleGroupByChange = useCallback((groupBy: string) => {
        setFilters({ groupBy: groupBy as any })
    }, [setFilters])

    const handleReset = useCallback(() => {
        resetFilters()
    }, [resetFilters])

    const getTimeRangeLabel = (preset: string) => {
        const labels: Record<string, string> = {
            "7d": "7 days",
            "30d": "30 days",
            "90d": "90 days",
            "1y": "1 year",
            "all": "All time"
        }
        return labels[preset] || preset
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Select value={timeRange.preset ?? "30d"} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">
                            <div className="flex items-center gap-2">
                                <span>Last 7 days</span>
                                <Badge variant="secondary" className="text-xs">Recent</Badge>
                            </div>
                        </SelectItem>
                        <SelectItem value="30d">
                            <div className="flex items-center gap-2">
                                <span>Last 30 days</span>
                                <Badge variant="secondary" className="text-xs">Month</Badge>
                            </div>
                        </SelectItem>
                        <SelectItem value="90d">
                            <div className="flex items-center gap-2">
                                <span>Last 90 days</span>
                                <Badge variant="secondary" className="text-xs">Quarter</Badge>
                            </div>
                        </SelectItem>
                        <SelectItem value="1y">
                            <div className="flex items-center gap-2">
                                <span>Last year</span>
                                <Badge variant="secondary" className="text-xs">Year</Badge>
                            </div>
                        </SelectItem>
                        <SelectItem value="all">
                            <div className="flex items-center gap-2">
                                <span>All time</span>
                                <Badge variant="outline" className="text-xs">Complete</Badge>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <Select value={filters.groupBy ?? "day"} onValueChange={handleGroupByChange}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="hour">Hourly</SelectItem>
                        <SelectItem value="day">Daily</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2"
            >
                <RefreshCw className="h-4 w-4" />
                Reset
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Period:</span>
                <Badge variant="outline" className="font-normal">
                    {getTimeRangeLabel(timeRange.preset ?? "30d")}
                </Badge>
            </div>
        </div>
    )
}

export default memo(Controls)

