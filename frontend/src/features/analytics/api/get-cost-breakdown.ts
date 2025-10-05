import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CostBreakdown, AnalyticsQueryParams } from '../types';

export const getCostBreakdown = (params: AnalyticsQueryParams = {}): Promise<CostBreakdown> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);

  return api.get(`/metrics/cost-breakdown?${searchParams.toString()}`);
};

export const useCostBreakdown = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'cost-breakdown', params],
    queryFn: () => getCostBreakdown(params),
    staleTime: 30 * 1000, // 30 seconds - analytics should update more frequently
    gcTime: 10 * 60 * 1000,
  });
};
