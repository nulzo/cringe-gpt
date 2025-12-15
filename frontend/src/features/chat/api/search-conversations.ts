import { api } from "@/lib/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";

interface ConversationSearchItem {
  id: number;
  conversation_id: string;
  current_node_id?: string | null;
  title: string;
  is_archived: boolean;
  is_starred: boolean | null;
  update_time: number;
  payload: {
    kind: "message";
    message_id?: string;
    snippet: string;
  };
}

interface ConversationSearchResponse {
  items: ConversationSearchItem[];
  cursor?: string | null;
}

const searchConversations = async (
  query: string,
  cursor?: string | null,
): Promise<ConversationSearchResponse> => {
  const params = new URLSearchParams({ query });
  if (cursor) params.set("cursor", cursor);
  const res = await api.get(`/conversations/search?${params.toString()}`);
  // Map backend C# PascalCase to frontend camelCase-like fields expected above
  const items = (res.items || res.Items || []).map((it: any) => ({
    id: it.id ?? it.Id,
    conversation_id: (it.conversationId ?? it.ConversationId)?.toString(),
    current_node_id:
      (it.currentNodeId ?? it.CurrentNodeId)?.toString?.() ?? null,
    title: it.title ?? it.Title,
    is_archived: it.isArchived ?? it.IsArchived ?? false,
    is_starred: it.isStarred ?? it.IsStarred ?? null,
    update_time: it.updateTime ?? it.UpdateTime,
    payload: {
      kind: (it.payload?.kind ?? it.Payload?.Kind) as "message",
      message_id: (
        it.payload?.messageId ?? it.Payload?.MessageId
      )?.toString?.(),
      snippet: it.payload?.snippet ?? it.Payload?.Snippet ?? "",
    },
  })) as ConversationSearchItem[];
  const cursorOut = res.cursor ?? res.Cursor ?? null;
  return { items, cursor: cursorOut };
};

export const useConversationSearch = (query: string) => {
  return useInfiniteQuery({
    queryKey: ["conversation-search", query],
    enabled: query.trim().length > 0,
    queryFn: ({ pageParam }) =>
      searchConversations(query, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
  });
};
