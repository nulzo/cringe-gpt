import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Conversation } from '@/features/chat/types';

const getConversations = async (): Promise<Conversation[]> => {
    const data = await api.get('/conversations');
    // Normalize keys for frontend consumers
    return (Array.isArray(data) ? data : []).map((c: any) => ({
        ...c,
        id: c.id ?? c.Id,
        conversation_id: c.conversation_id ?? c.conversationId ?? c.conversation_uuid,
        title: c.title ?? c.Title,
        created_at: c.created_at ?? c.createdAt,
        updated_at: c.updated_at ?? c.updatedAt,
        isPinned: c.isPinned ?? c.is_pinned ?? false,
        isHidden: c.isHidden ?? c.is_hidden ?? false,
        tags: c.tags ?? c.Tags ?? [],
    }));
};

export const useConversations = () => {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: getConversations,
    });
};
