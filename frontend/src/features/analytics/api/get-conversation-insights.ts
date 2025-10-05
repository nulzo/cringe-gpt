import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ConversationInsights, AnalyticsQueryParams } from '../types';

export const getConversationInsights = (params: AnalyticsQueryParams & { topCount?: number } = {}): Promise<ConversationInsights> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.topCount) searchParams.append('topCount', params.topCount.toString());

  return api.get(`/metrics/conversations/insights?${searchParams.toString()}`);
};

export const useConversationInsights = (params: AnalyticsQueryParams & { topCount?: number } = {}) => {
  return useQuery({
    queryKey: ['analytics', 'conversations', 'insights', params],
    queryFn: () => getConversationInsights(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
