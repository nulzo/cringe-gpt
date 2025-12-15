import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { type ProviderType } from "@/features/chat/types";
import { type ProviderSettings } from "./get-provider-settings";

const updateProviderSettings = (
  provider: ProviderType,
  data: ProviderSettings,
) => api.post<void>(`/providers/me/credentials/${provider}`, data);

export const useUpdateProviderSettings = (provider: ProviderType) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: ProviderSettings) =>
      updateProviderSettings(provider, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providerSettings", provider] });
    },
  });
};
