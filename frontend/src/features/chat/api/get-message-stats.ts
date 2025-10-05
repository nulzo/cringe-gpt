import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface MessageStatsResponse {
  totalMessages: number;
  likedMessages: number;
  assistantMessages: number;
  userMessages: number;
  messagesByProvider: Record<string, number>;
  messagesByModel: Record<string, number>;
}

const getMessageStatsFn = async (): Promise<MessageStatsResponse> => {
  return api.get(`/messages/stats`);
};

export const useMessageStats = () => {
  return useQuery({
    queryKey: ['message-stats'],
    queryFn: getMessageStatsFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
