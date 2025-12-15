import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Tag } from "../types";

const getTags = async (): Promise<Tag[]> => {
  const data = await api.get("/tags");
  return Array.isArray(data)
    ? data.map((t: any) => ({
        id: t.id ?? t.Id,
        name: t.name ?? t.Name,
      }))
    : [];
};

export const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
    staleTime: 5 * 60 * 1000,
  });
};

