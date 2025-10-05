import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { type ConversationSummary } from '../../chat/types';

export const getPinnedConversations = (): Promise<ConversationSummary[]> => {
  return api.get('/conversations/pinned');
};

export const usePinnedConversations = (
  options?: Partial<UseQueryOptions<ConversationSummary[], Error>>
) => {
  return useQuery<ConversationSummary[], Error>({
    queryKey: ['pinned-conversations'],
    queryFn: getPinnedConversations,
    ...options,
  });
};
