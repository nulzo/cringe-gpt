import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { UsageHabits, AnalyticsQueryParams } from '../types';

export const getUsageHabits = (params: AnalyticsQueryParams = {}): Promise<UsageHabits> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);

  return api.get(`/metrics/usage-habits?${searchParams.toString()}`);
};

export const useUsageHabits = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'usage-habits', params],
    queryFn: () => getUsageHabits(params),
    staleTime: 30 * 1000, // 30 seconds - analytics should update more frequently
    gcTime: 10 * 60 * 1000,
  });
};
