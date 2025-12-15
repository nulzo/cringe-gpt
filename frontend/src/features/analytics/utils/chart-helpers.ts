import type { TimeSeriesMetrics } from "../types";

/**
 * Fills missing dates in time series data with 0 values
 * This ensures time-based charts show all dates, even those with no activity
 */
export function fillMissingDates<T extends TimeSeriesMetrics>(
  data: T[],
  dateKey: keyof T = "date",
  groupBy: "day" | "hour" = "day",
  startDate?: Date,
  endDate?: Date,
): T[] {
  if (!data.length) return [];

  const sortedData = [...data].sort(
    (a, b) =>
      new Date(a[dateKey] as string).getTime() -
      new Date(b[dateKey] as string).getTime(),
  );

  const firstDate = startDate || new Date(sortedData[0][dateKey] as string);
  const lastDate =
    endDate || new Date(sortedData[sortedData.length - 1][dateKey] as string);

  const filledData: T[] = [];
  const dateMap = new Map<string, T>();

  // Create a map of existing data using normalized date keys (YYYY-MM-DD)
  sortedData.forEach((item) => {
    const dateStr = item[dateKey] as string;
    // Normalize to YYYY-MM-DD format for consistent comparison, preserving original data
    const date = new Date(dateStr);
    const normalizedDate = date.toISOString().split("T")[0];
    dateMap.set(normalizedDate, item);
  });

  // Fill in missing dates
  const currentDate = new Date(firstDate);
  while (currentDate <= lastDate) {
    const normalizedDateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format for lookup
    const fullDateStr = currentDate.toISOString(); // Full ISO format for data entry

    if (dateMap.has(normalizedDateStr)) {
      filledData.push(dateMap.get(normalizedDateStr)!);
    } else {
      // Create a zero-filled entry for missing date
      const zeroEntry = {
        ...sortedData[0], // Use first entry as template
        [dateKey]: fullDateStr, // Use full ISO format to match API response
        requests: 0,
        cost: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        averageDurationMs: 0,
      } as T;
      filledData.push(zeroEntry);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return filledData;
}

// Additional chart helpers removed until we need richer chart composition
