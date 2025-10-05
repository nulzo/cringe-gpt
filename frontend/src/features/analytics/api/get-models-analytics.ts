import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { MetricsByModel, AnalyticsQueryParams } from '../types';

export const getModelsAnalytics = (params: AnalyticsQueryParams = {}): Promise<MetricsByModel[]> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.limit) searchParams.append('limit', params.limit.toString());

  return api.get(`/metrics/models/enhanced?${searchParams.toString()}`);
};

export const useModelsAnalytics = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'models', params],
    queryFn: () => getModelsAnalytics(params),
    staleTime: 30 * 1000, // 30 seconds - analytics should update more frequently
    gcTime: 10 * 60 * 1000,
  });
};
