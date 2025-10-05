import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { TrendData, AnalyticsQueryParams } from '../types';

export const getCostTrends = (params: AnalyticsQueryParams): Promise<TrendData> => {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.groupBy) searchParams.append('groupBy', params.groupBy);

  return api.get(`/metrics/trends/cost?${searchParams.toString()}`);
};

export const getUsageTrends = (params: AnalyticsQueryParams): Promise<TrendData> => {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.groupBy) searchParams.append('groupBy', params.groupBy);

  return api.get(`/metrics/trends/usage?${searchParams.toString()}`);
};

export const getPerformanceTrends = (params: AnalyticsQueryParams): Promise<TrendData> => {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.groupBy) searchParams.append('groupBy', params.groupBy);

  return api.get(`/metrics/trends/performance?${searchParams.toString()}`);
};

export const useCostTrends = (params: AnalyticsQueryParams) => {
  return useQuery({
    queryKey: ['analytics', 'trends', 'cost', params],
    queryFn: () => getCostTrends(params),
    staleTime: 30 * 1000, // 30 seconds - analytics should update more frequently
    gcTime: 10 * 60 * 1000,
  });
};

export const useUsageTrends = (params: AnalyticsQueryParams) => {
  return useQuery({
    queryKey: ['analytics', 'trends', 'usage', params],
    queryFn: () => getUsageTrends(params),
    staleTime: 30 * 1000, // 30 seconds - analytics should update more frequently
    gcTime: 10 * 60 * 1000,
  });
};

export const usePerformanceTrends = (params: AnalyticsQueryParams) => {
  return useQuery({
    queryKey: ['analytics', 'trends', 'performance', params],
    queryFn: () => getPerformanceTrends(params),
    staleTime: 30 * 1000, // 30 seconds - analytics should update more frequently
    gcTime: 10 * 60 * 1000,
  });
};
