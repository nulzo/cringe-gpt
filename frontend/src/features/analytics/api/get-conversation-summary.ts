import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ConversationAnalyticsSummary, AnalyticsQueryParams } from '../types';

export const getConversationAnalyticsSummary = (params: AnalyticsQueryParams = {}): Promise<ConversationAnalyticsSummary> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);

  return api.get(`/metrics/conversations/summary?${searchParams.toString()}`);
};

export const useConversationAnalyticsSummary = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'conversations', 'summary', params],
    queryFn: () => getConversationAnalyticsSummary(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
