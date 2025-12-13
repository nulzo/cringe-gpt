"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface SparklineProps {
  data: number[]
  width?: number | string
  height?: number
  className?: string
  color?: string
  showDot?: boolean
}

export function Sparkline({
  data,
  width = 100,
  height = 24,
  className,
  color = "currentColor",
  showDot = true,
}: SparklineProps) {
  const widthNum = typeof width === "number" ? width : 100

  const stats = useMemo(() => {
    if (!data || data.length === 0) return { min: 0, max: 1 }
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    for (let i = 0; i < data.length; i++) {
      const v = data[i]
      if (!Number.isFinite(v)) continue
      if (v < min) min = v
      if (v > max) max = v
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 }
    // Avoid zero-range charts
    if (min === max) return { min: min - 1, max: max + 1 }
    return { min, max }
  }, [data])

  const path = useMemo(() => {
    if (!data || data.length === 0) return ""

    const padding = 4 // prevents clipping
    const range = stats.max - stats.min || 1
    const innerH = Math.max(1, height - 2 * padding)
    const xDenom = Math.max(1, data.length - 1)

    // Special case: a single point should still render a visible line
    if (data.length === 1) {
      const v = Number.isFinite(data[0]) ? data[0] : 0
      const y = (height - padding) - ((v - stats.min) / range) * innerH
      return `M 0 ${y} L ${widthNum} ${y}`
    }

    let d = ""
    for (let i = 0; i < data.length; i++) {
      const v = Number.isFinite(data[i]) ? data[i] : stats.min
      const x = (i / xDenom) * widthNum
      const y = (height - padding) - ((v - stats.min) / range) * innerH
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
    }
    return d
  }, [data, height, stats.max, stats.min, widthNum])

  const lastPoint = useMemo(() => {
    if (!data || data.length === 0) return null
    const padding = 4
    const range = stats.max - stats.min || 1
    const innerH = Math.max(1, height - 2 * padding)
    const value = Number.isFinite(data[data.length - 1]) ? data[data.length - 1] : stats.min
    return {
      x: widthNum,
      y: (height - padding) - ((value - stats.min) / range) * innerH,
    }
  }, [data, height, stats.max, stats.min, widthNum])

  if (!data || data.length === 0) {
    return <div className={cn("opacity-30", className)} style={{ width, height }} />
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn("block overflow-visible", className)}
      viewBox={`0 0 ${widthNum} ${height}`}
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-100"
        vectorEffect="non-scaling-stroke"
      />
      {showDot && lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={3}
          fill={color}
          className="opacity-100"
        />
      )}
    </svg>
  )
}
