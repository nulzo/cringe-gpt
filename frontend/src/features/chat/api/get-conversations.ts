import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Conversation } from '@/features/chat/types';

export const getConversations = async (): Promise<Conversation[]> => {
    const data = await api.get('/conversations');
    // Ensure id and title exist, keep typing consistent
    return (Array.isArray(data) ? data : []).map((c: any) => ({
        ...c,
        id: c.id,
        title: c.title,
    }));
};

export const useConversations = () => {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: getConversations,
    });
};
