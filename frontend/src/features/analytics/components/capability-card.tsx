"use client"

import { useMemo, memo } from "react"
import { IconChevronRight } from "@tabler/icons-react"
import { BarChart, Bar, XAxis } from "recharts"
import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface CapabilityCardProps {
  title: string
  metrics: { label: string; value: number | string; color?: string }[]
  chartData?: { date: string; value: number }[]
  onClick?: () => void
  className?: string
}

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--primary))",
  },
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

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border border-border/60 bg-card/50 p-4 transition-colors",
        onClick && "cursor-pointer hover:border-border hover:bg-card/80",
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
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="h-full w-full rounded-t-sm bg-muted"
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              ))}
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart accessibilityLayer data={chartData}>
                <XAxis hide dataKey="date" />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.1)" }}
                  content={<ChartTooltipContent hideLabel indicator="line" />}
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ChartContainer>
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

