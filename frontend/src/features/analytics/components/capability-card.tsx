"use client"

import { useMemo } from "react"
import { IconChevronRight } from "@tabler/icons-react"
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { cn } from "@/lib/utils"

interface CapabilityCardProps {
  title: string
  metrics: { label: string; value: number | string; color?: string }[]
  chartData?: { date: string; value: number }[]
  onClick?: () => void
  className?: string
}

export function CapabilityCard({
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

  const maxValue = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0
    return Math.max(...chartData.map((d) => d.value))
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
      <div className="mt-4 flex-1">
        <div className="h-[120px] w-full">
          {!hasData ? (
            <div className="flex h-full items-end justify-between gap-px px-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="h-px w-full bg-border/40"
                  style={{ marginBottom: "50%" }}
                />
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                  hide
                />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-popover px-2 py-1.5 text-xs shadow-md">
                        <p className="text-muted-foreground">
                          {new Date(d.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="font-medium">{d.value.toLocaleString()}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={12}>
                  {chartData?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
}

