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

  const mergedImages: any[] = [];

  // Helper to pull a property regardless of Pascal/camel case
  const pick = (obj: any, ...keys: string[]) => {
    for (const k of keys) {
      if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return (obj as any)[k];
    }
    return undefined;
  };

  const addProcessedImages = (imgs?: any[]) => {
    if (!Array.isArray(imgs)) return;
    imgs.forEach((p: any, index: number) => {
      if (p?.id) {
        mergedImages.push({
          id: p.id,
          name: p.name ?? `Image ${index + 1}`,
          url: p.url,
          mimeType: p.mimeType,
        });
      }
    });
  };

  // Inline/streaming images (no persisted id yet)
  const addInlineImages = (imgs?: any[]) => {
    if (!Array.isArray(imgs)) return;
    imgs.forEach((img: any, index: number) => {
      // Only treat as inline if there is no persisted id
      if (img?.id) return;
      const url = img?.image_url?.url ?? img?.url;
      if (url) {
        mergedImages.push({
          type: img?.type ?? 'image_url',
          image_url: { url },
          index: img?.index ?? index,
        });
      }
    });
  };

  // Images can arrive under several shapes; normalize them all
  addProcessedImages(pick(m, 'processedImages', 'ProcessedImages'));
  addProcessedImages(pick(m, 'images', 'Images'));

  // Raw image_url streaming payloads (no file id yet)
  addInlineImages(pick(m, 'images', 'Images'));

  // image_ids from legacy flow
  const imageIds = pick(m, 'image_ids', 'imageIds', 'ImageIds') as (string | number)[] | undefined;
  if (Array.isArray(imageIds) && imageIds.length > 0) {
    mergedImages.push(...imageIds.map((id) => ({ id } as any)));
  }

  // toolCallsJson/tool_calls_json may contain serialized MessageImageDto[]
  const toolCallsJson = pick(
    m,
    'toolCallsJson',
    'ToolCallsJson',
    'tool_calls_json',
    'tool_callsJson',
    'tool_calls'
  );

  if (toolCallsJson) {
    try {
      const parsed = typeof toolCallsJson === 'string' ? JSON.parse(toolCallsJson) : toolCallsJson;
      if (Array.isArray(parsed)) {
        // Could be list of ids or list of objects
        parsed.forEach((p: any, idx: number) => {
          if (p?.id) {
            mergedImages.push({
              id: p.id,
              name: p.name ?? `Image ${idx + 1}`,
              url: p.url,
              mimeType: p.mimeType,
            });
          } else if (typeof p === 'number' || typeof p === 'string') {
            mergedImages.push({ id: p });
          }
        });
      }
    } catch (e) {
      // swallow – malformed payloads should not break chat rendering
      console.warn('Failed to parse toolCallsJson for message', m, e);
    }
  }

  if (mergedImages.length > 0) {
    // Deduplicate by id or by canonical url to avoid double-rendering (streamed + persisted)
    const seen = new Set<string>();
    const unique = mergedImages.filter((img) => {
      const key =
        (img.id ? `id:${img.id}` : null) ??
        (img.image_url?.url ? `url:${img.image_url.url}` : null) ??
        (img.url ? `url:${img.url}` : null);
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    (camel as any).images = unique;
    camel.has_images = camel.has_images ?? true;
  }

  return camel;
};

const getConversation = async (conversationId: string): Promise<Conversation> => {
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
