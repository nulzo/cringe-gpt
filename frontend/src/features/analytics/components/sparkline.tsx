"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface SparklineProps {
  data: number[]
  width?: number
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
  const path = useMemo(() => {
    if (!data || data.length === 0) return ""

    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * width
      const y = height - ((value - min) / range) * height
      return { x, y }
    })

    const d = points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`
      
      // Smooth curve using quadratic bezier
      const prev = points[i - 1]
      const cpX = (prev.x + point.x) / 2
      return `${acc} Q ${cpX} ${prev.y} ${point.x} ${point.y}`
    }, "")

    return d
  }, [data, width, height])

  const lastPoint = useMemo(() => {
    if (!data || data.length === 0) return null
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    const value = data[data.length - 1]
    return {
      x: width,
      y: height - ((value - min) / range) * height,
    }
  }, [data, width, height])

  if (!data || data.length === 0) {
    return <div className={cn("opacity-30", className)} style={{ width, height }} />
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-70"
      />
      {showDot && lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={3}
          fill={color}
          className="opacity-90"
        />
      )}
    </svg>
  )
}



