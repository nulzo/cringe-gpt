import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  ImageGenerationRequestDto,
  ImageGenerationResponseDto,
} from "./types";

export const useGenerateImage = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ImageGenerationResponseDto,
    unknown,
    ImageGenerationRequestDto
  >({
    mutationFn: (data) =>
      api.post("/images/generations", data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
