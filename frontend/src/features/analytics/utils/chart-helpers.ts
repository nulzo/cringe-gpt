import type { TimeSeriesMetrics } from '../types';

/**
 * Fills missing dates in time series data with 0 values
 * This ensures time-based charts show all dates, even those with no activity
 */
export function fillMissingDates<T extends TimeSeriesMetrics>(
  data: T[],
  dateKey: keyof T = 'date',
  groupBy: 'day' | 'hour' | 'month' = 'day',
  startDate?: Date,
  endDate?: Date
): T[] {
  if (!data.length) return [];

  const sortedData = [...data].sort((a, b) =>
    new Date(a[dateKey] as string).getTime() - new Date(b[dateKey] as string).getTime()
  );

  const firstDate = startDate || new Date(sortedData[0][dateKey] as string);
  const lastDate = endDate || new Date(sortedData[sortedData.length - 1][dateKey] as string);

  const filledData: T[] = [];
  const dateMap = new Map<string, T>();

  function normalizeKey(d: Date): string {
    if (groupBy === 'hour') {
      // YYYY-MM-DDTHH
      const iso = d.toISOString();
      return iso.slice(0, 13);
    }
    if (groupBy === 'month') {
      // YYYY-MM
      const iso = d.toISOString();
      return iso.slice(0, 7);
    }
    // day -> YYYY-MM-DD
    return d.toISOString().split('T')[0];
  }

  // Create a map of existing data using normalized keys
  sortedData.forEach(item => {
    const dateStr = item[dateKey] as string;
    const date = new Date(dateStr);
    dateMap.set(normalizeKey(date), item);
  });

  // Fill in missing dates
  const currentDate = new Date(firstDate);
  if (groupBy === 'hour') {
    currentDate.setMinutes(0, 0, 0);
  }
  if (groupBy === 'month') {
    currentDate.setDate(1);
    currentDate.setHours(0, 0, 0, 0);
  }
  while (currentDate <= lastDate) {
    const normalizedDateStr = normalizeKey(currentDate);
    const fullDateStr = currentDate.toISOString();

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

    // Move to next bucket
    if (groupBy === 'hour') {
      currentDate.setHours(currentDate.getHours() + 1);
    } else if (groupBy === 'month') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return filledData;
}

// Additional chart helpers removed until we need richer chart composition
