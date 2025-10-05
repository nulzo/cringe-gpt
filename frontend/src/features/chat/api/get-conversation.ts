import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { type Conversation, type Message } from '../types';

export const normalizeMessage = (m: any): Message => {
  const camel = {
    id: m.id ?? m.messageId ?? m.message_id,
    messageId: m.messageId ?? m.message_id,
    parentMessageId: m.parentMessageId ?? m.parent_message_id,
    conversation_uuid: String(m.conversation_uuid ?? m.conversationId ?? m.conversation_id ?? ''),
    role: m.role,
    content: m.content ?? '',
    created_at: m.created_at ?? m.createdAt ?? new Date().toISOString(),
    name: m.name,
    provider: m.provider,
    model: m.model,
    tokens_used: m.tokens_used ?? m.tokenCount,
    generation_time: m.generation_time ?? m.generationTime,
    total_cost: m.total_cost ?? m.totalCost,
    finish_reason: m.finish_reason ?? m.finishReason,
    is_liked: m.is_liked ?? m.isLiked,
    isLiked: m.isLiked ?? m.is_liked,
    is_hidden: m.is_hidden,
    is_error: m.is_error,
    is_interrupted: m.is_interrupted,
    has_images: m.has_images,
    image_ids: m.image_ids,
    has_citations: m.has_citations,
    citations: m.citations,
    has_tool_calls: m.has_tool_calls,
    tool_calls: m.tool_calls,
    attachments: m.attachments,
    error: m.error,
  } as Message;

  // Unify images into processed image IDs interface for UI
  const processed = m.processedImages as any[] | undefined;
  const imageIds = m.image_ids as (string | number)[] | undefined;
  if (Array.isArray(processed) && processed.length > 0) {
    (camel as any).images = processed.map((p: any) => ({ id: p.id, name: p.name, url: p.url, mimeType: p.mimeType }));
  } else if (Array.isArray(imageIds) && imageIds.length > 0) {
    (camel as any).images = imageIds.map((id) => ({ id } as any));
  }

  return camel;
};

export const getConversation = async (conversationId: string): Promise<Conversation> => {
  const res = await api.get(`/conversations/${conversationId}`);
  if (res && Array.isArray(res.messages)) {
    res.messages = res.messages.map(normalizeMessage);
  }
  return res;
};

export const useConversation = (
  conversationId: string,
  options?: Partial<UseQueryOptions<Conversation, Error>>
) => {
  return useQuery<Conversation, Error>({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
    ...options,
  });
};
