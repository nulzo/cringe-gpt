import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { type Message } from "../../chat/types";

interface LikedMessagesResponse {
  data: Message[];
  pagination: {
    page: number;
    pageSize: number;
  };
}

const getLikedMessages = (
  page = 1,
  pageSize = 20,
): Promise<LikedMessagesResponse> => {
  return api.get(`/messages/liked?page=${page}&pageSize=${pageSize}`);
};

export const useLikedMessages = (
  page = 1,
  pageSize = 20,
  options?: Partial<UseQueryOptions<LikedMessagesResponse, Error>>,
) => {
  return useQuery<LikedMessagesResponse, Error>({
    queryKey: ["liked-messages", page, pageSize],
    queryFn: () => getLikedMessages(page, pageSize),
    ...options,
  });
};
