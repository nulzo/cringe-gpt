import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Conversation } from "../types";

export type ConversationUpdateInput = {
  id: number | string;
  title?: string;
  isHidden?: boolean;
  isPinned?: boolean;
  tags?: string[];
};

const updateConversation = async (
  input: ConversationUpdateInput,
): Promise<Conversation> => {
  const { id, ...body } = input;
  const payload: Record<string, any> = { ...body };

  // Avoid sending undefined to keep partial updates small
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  return api.put(`/conversations/${id}`, payload);
};

export const useUpdateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateConversation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["conversation", data.id.toString()],
        });
      }
    },
  });
};

