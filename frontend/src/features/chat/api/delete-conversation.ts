import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const deleteConversation = async (id: number | string) => {
  await api.delete(`/conversations/${id}`);
  return id;
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["conversation", id.toString()],
      });
    },
  });
};

