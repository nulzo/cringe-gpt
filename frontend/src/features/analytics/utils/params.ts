import type { AnalyticsQueryParams } from "@/features/analytics/types"

export type MaybeDate = Date | string | undefined | null

export function toIso(d: MaybeDate): string | undefined {
    if (!d) return undefined
    const date = typeof d === "string" ? new Date(d) : d
    return isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function toQueryParams(
    range: { from?: MaybeDate; to?: MaybeDate },
    groupBy?: "hour" | "day" | "month"
): AnalyticsQueryParams {
    return {
        from: toIso(range.from),
        to: toIso(range.to),
        groupBy,
    }
}


