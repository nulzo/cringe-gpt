import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ConversationPattern, AnalyticsQueryParams } from '../types';

export const getConversationPatterns = (params: AnalyticsQueryParams = {}): Promise<ConversationPattern[]> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);

  return api.get(`/metrics/conversations/patterns?${searchParams.toString()}`);
};

export const useConversationPatterns = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'conversations', 'patterns', params],
    queryFn: () => getConversationPatterns(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
