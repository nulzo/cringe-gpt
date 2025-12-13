"use client"

import { useId, useMemo } from "react"
import { cn } from "@/lib/utils"

interface SparklineProps {
  data: number[]
  width?: number | string
  height?: number
  className?: string
  color?: string
  showDot?: boolean
  strokeWidth?: number
  variant?: "line" | "area"
}

export function Sparkline({
  data,
  width = 100,
  height = 24,
  className,
  color = "currentColor",
  showDot = true,
  strokeWidth = 2,
  variant = "line",
}: SparklineProps) {
  const gradientId = useId()
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

  const paths = useMemo(() => {
    if (!data || data.length === 0) return ""

    // Prevent clipping (especially when `width="100%"` and the last dot is at the edge)
    const dotR = showDot ? Math.max(2.5, strokeWidth + 0.5) : 0
    const padX = Math.max(2, dotR + 1)
    const padY = Math.max(2, dotR + 1)

    const range = stats.max - stats.min || 1
    const innerW = Math.max(1, widthNum - 2 * padX)
    const innerH = Math.max(1, height - 2 * padY)
    const xDenom = Math.max(1, data.length - 1)

    // Special case: a single point should still render a visible line
    if (data.length === 1) {
      const v = Number.isFinite(data[0]) ? data[0] : 0
      const y = (height - padY) - ((v - stats.min) / range) * innerH
      const x0 = padX
      const x1 = padX + innerW
      const d = `M ${x0} ${y} L ${x1} ${y}`
      const a = `M ${x0} ${height - padY} L ${x0} ${y} L ${x1} ${y} L ${x1} ${height - padY} Z`
      return { line: d, area: a, last: { x: x1, y } }
    }

    let d = ""
    let lastX = padX
    let lastY = height - padY
    for (let i = 0; i < data.length; i++) {
      const v = Number.isFinite(data[i]) ? data[i] : stats.min
      const x = padX + (i / xDenom) * innerW
      const y = (height - padY) - ((v - stats.min) / range) * innerH
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
      lastX = x
      lastY = y
    }
    const firstX = padX
    const area = `M ${firstX} ${height - padY} ${d.replace(/^M/, "L")} L ${lastX} ${height - padY} Z`
    return { line: d, area, last: { x: lastX, y: lastY } }
  }, [data, height, showDot, stats.max, stats.min, strokeWidth, widthNum])

  if (!data || data.length === 0) {
    return <div className={cn("opacity-30", className)} style={{ width, height }} />
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn("block", className)}
      viewBox={`0 0 ${widthNum} ${height}`}
      preserveAspectRatio="none"
      shapeRendering="geometricPrecision"
    >
      {variant === "area" && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {variant === "area" && typeof paths !== "string" && (
        <path d={paths.area} fill={`url(#${gradientId})`} stroke="none" />
      )}
      <path
        d={typeof paths === "string" ? paths : paths.line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-100"
        vectorEffect="non-scaling-stroke"
      />
      {showDot && typeof paths !== "string" && (
        <circle
          cx={paths.last.x}
          cy={paths.last.y}
          r={Math.max(2.5, strokeWidth + 0.5)}
          fill={color}
          className="opacity-100"
        />
      )}
    </svg>
  )
}
