"use client"

import { useMemo, memo } from "react"
import { IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Sparkline } from "./sparkline"

interface CapabilityCardProps {
  title: string
  metrics: { label: string; value: number | string; color?: string }[]
  chartData?: { date: string; value: number }[]
  onClick?: () => void
  className?: string
}

export const CapabilityCard = memo(function CapabilityCard({
  title,
  metrics,
  chartData,
  onClick,
  className,
}: CapabilityCardProps) {
  const hasData = useMemo(() => {
    if (!chartData) return false
    return chartData.some((d) => d.value > 0)
  }, [chartData])

  const series = useMemo(() => (chartData ? chartData.map((d) => d.value) : []), [chartData])
  const sparkColor = metrics[0]?.color || "hsl(var(--primary))"

  const placeholderHeights = useMemo(
    () => [22, 28, 35, 30, 42, 34, 50, 44, 58, 46, 62, 55, 70, 60, 74, 66, 78, 72, 82, 76],
    []
  )

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-colors",
        onClick && "cursor-pointer hover:border-border/70 hover:bg-card/95",
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1 text-sm font-medium text-foreground">
          {title}
          {onClick && (
            <IconChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </h3>
      </div>

      {/* Metrics */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {metrics.map((metric, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: metric.color || "hsl(var(--primary))" }}
            />
            <span>
              {typeof metric.value === "number"
                ? metric.value.toLocaleString()
                : metric.value}{" "}
              {metric.label}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-6 flex-1">
        <div className="h-[100px] w-full">
          {!hasData ? (
            <div className="flex h-full items-end justify-between gap-px px-1 opacity-20">
              {placeholderHeights.map((h, i) => (
                <div
                  key={i}
                  className="h-full w-full rounded-t-sm bg-muted"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          ) : (
            <div className="h-full w-full">
              <Sparkline
                data={series}
                width="100%"
                height={100}
                color={sparkColor}
                variant="area"
                strokeWidth={1.75}
                showDot={false}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* X-axis labels */}
      {chartData && chartData.length > 0 && (
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/60">
          <span>
            {new Date(chartData[0].date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span>
            {new Date(chartData[chartData.length - 1].date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  )
})

