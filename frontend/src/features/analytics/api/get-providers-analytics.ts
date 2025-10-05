import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { MetricsByProvider, AnalyticsQueryParams } from '../types';

export const getProvidersAnalytics = (params: AnalyticsQueryParams = {}): Promise<MetricsByProvider[]> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);

  return api.get(`/metrics/providers/enhanced?${searchParams.toString()}`);
};

export const useProvidersAnalytics = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'providers', params],
    queryFn: () => getProvidersAnalytics(params),
    staleTime: 30 * 1000, // 30 seconds - analytics should update more frequently
    gcTime: 10 * 60 * 1000,
  });
};
