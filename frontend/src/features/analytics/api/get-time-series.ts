import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { TimeSeriesMetrics, AnalyticsQueryParams } from '../types';

const getTimeSeriesMetrics = (params: AnalyticsQueryParams = {}): Promise<TimeSeriesMetrics[]> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.groupBy) searchParams.append('groupBy', params.groupBy);

  return api.get(`/metrics/timeseries?${searchParams.toString()}`);
};

export const useTimeSeriesMetrics = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'timeseries', params],
    queryFn: () => getTimeSeriesMetrics(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: keepPreviousData,
  });
};
