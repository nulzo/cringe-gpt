import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { AnalyticsDashboard, AnalyticsQueryParams } from '../types';

const getDashboardAnalytics = (params: AnalyticsQueryParams = {}): Promise<AnalyticsDashboard> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.groupBy) searchParams.append('groupBy', params.groupBy);

  return api.get(`/metrics/dashboard?${searchParams.toString()}`);
};

export const useDashboardAnalytics = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'dashboard', params],
    queryFn: () => getDashboardAnalytics(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: keepPreviousData,
  });
};
