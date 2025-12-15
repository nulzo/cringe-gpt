import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { type Message } from "@/features/chat/types";

interface UpdateLikeStatusParams {
  messageId: string;
  isLiked: boolean;
}

interface UpdateLikeStatusResponse {
  id: number;
  messageId: string; // Backend sends camelCase
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  isLiked: boolean;
  // ... other message fields
}

const updateMessageLikeFn = async ({
  messageId,
  isLiked,
}: UpdateLikeStatusParams): Promise<UpdateLikeStatusResponse> => {
  return api.patch(`/messages/${messageId}/like`, { isLiked });
};

export const useUpdateMessageLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMessageLikeFn,
    onSuccess: (data) => {
      // Update the message in all relevant queries
      queryClient.invalidateQueries({
        queryKey: ["conversation", data.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // Also update any cached message data
      queryClient.setQueryData(["message", data.messageId], data);
    },
    onError: (error) => {
      console.error("Failed to update message like status:", error);
    },
  });
};
