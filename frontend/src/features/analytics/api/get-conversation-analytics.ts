import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ConversationAnalytics, AnalyticsQueryParams } from '../types';

export const getConversationAnalytics = (params: AnalyticsQueryParams = {}): Promise<ConversationAnalytics[]> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);

  return api.get(`/metrics/conversations?${searchParams.toString()}`);
};

export const getConversationAnalyticsById = (conversationId: number): Promise<ConversationAnalytics> => {
  return api.get(`/metrics/conversations/${conversationId}`);
};

export const useConversationAnalytics = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'conversations', params],
    queryFn: () => getConversationAnalytics(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useConversationAnalyticsById = (conversationId: number) => {
  return useQuery({
    queryKey: ['analytics', 'conversation', conversationId],
    queryFn: () => getConversationAnalyticsById(conversationId),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!conversationId,
  });
};
