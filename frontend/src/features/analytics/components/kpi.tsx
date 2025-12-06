"use client"

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function KPI({
    label,
    value,
    hint,
    trend,
    className,
}: {
    label: string
    value: string
    hint?: string
    trend?: "up" | "down" | "neutral"
    className?: string
}) {
    return (
        <Card className={cn("transition-all duration-200 hover:shadow-md border-border/60 bg-card/70 backdrop-blur-sm", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    {label}
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs",
                            trend === "up" && "text-green-600",
                            trend === "down" && "text-red-600",
                            trend === "neutral" && "text-muted-foreground"
                        )}>
                            {trend === "up" && <TrendingUp className="h-3 w-3" />}
                            {trend === "down" && <TrendingDown className="h-3 w-3" />}
                        </div>
                    )}
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground mt-1">
                    {value}
                </CardDescription>
                {hint && (
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {hint}
                    </div>
                )}
            </CardHeader>
        </Card>
    )
}

export function KPISkeleton() {
    return (
        <div className="grid gap-4 @[48rem]:grid-cols-2 @[80rem]:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse border-border/60 bg-card/70 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32 mt-2" />
                        <Skeleton className="h-3 w-20 mt-2" />
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}

// Enhanced KPI with comparison
export function ComparisonKPI({
    label,
    value,
    previousValue,
    hint,
    format = "number",
    className,
}: {
    label: string
    value: number
    previousValue?: number
    hint?: string
    format?: "number" | "currency" | "percentage"
    className?: string
}) {
    const formatValue = (val: number) => {
        switch (format) {
            case "currency":
                return `$${val.toFixed(4)}`
            case "percentage":
                return `${val.toFixed(1)}%`
            default:
                return val.toLocaleString()
        }
    }

    const calculateChange = () => {
        if (!previousValue || previousValue === 0) return null
        const change = ((value - previousValue) / previousValue) * 100
        return {
            value: Math.abs(change),
            direction: change >= 0 ? "up" : "down" as const,
            formatted: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`
        }
    }

    const change = calculateChange()

    return (
        <Card className={cn("transition-all duration-200 hover:shadow-md border-border/60 bg-card/70 backdrop-blur-sm", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    {label}
                    {change && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            change.direction === "up" && "text-green-600",
                            change.direction === "down" && "text-red-600"
                        )}>
                            {change.direction === "up" ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : (
                                <TrendingDown className="h-3 w-3" />
                            )}
                            {change.formatted}
                        </div>
                    )}
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground mt-1">
                    {formatValue(value)}
                </CardDescription>
                {hint && (
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {hint}
                    </div>
                )}
            </CardHeader>
        </Card>
    )
}


