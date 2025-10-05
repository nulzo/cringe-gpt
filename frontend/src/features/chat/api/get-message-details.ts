import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface MessageDetailsResponse {
  messageId: string;
  parentMessageId?: string;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  provider?: string;
  model?: string;
  tokenCount?: number;
  finishReason?: string;
  isLiked: boolean;
  isHidden: boolean;
  isError: boolean;
  hasImages: boolean;
  hasCitations: boolean;
  hasToolCalls: boolean;
  generationTime?: number;
  totalCost?: number;
  attachmentCount: number;
}

const getMessageDetailsFn = async (messageId: string): Promise<MessageDetailsResponse> => {
  return api.get(`/messages/${messageId}`);
};

export const useMessageDetails = (messageId: string, enabled = true) => {
  return useQuery({
    queryKey: ['message-details', messageId],
    queryFn: () => getMessageDetailsFn(messageId),
    enabled: enabled && !!messageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
