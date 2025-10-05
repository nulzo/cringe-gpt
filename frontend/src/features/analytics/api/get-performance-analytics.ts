import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { PerformanceMetrics, AnalyticsQueryParams } from '../types';

export const getPerformanceAnalytics = (params: AnalyticsQueryParams = {}): Promise<PerformanceMetrics> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);

  return api.get(`/metrics/performance?${searchParams.toString()}`);
};

export const usePerformanceAnalytics = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'performance', params],
    queryFn: () => getPerformanceAnalytics(params),
    staleTime: 30 * 1000, // 30 seconds - analytics should update more frequently
    gcTime: 10 * 60 * 1000,
  });
};
