import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Settings } from "@/features/settings/types";
import { useAuthStore } from "@/stores/auth-store";

type UpdateSettingsInput = {
  settings?: Partial<Settings["settings"]>;
  name?: string;
  avatarDataUrl?: string;
  removeAvatar?: boolean;
};

const updateSettings = (data: UpdateSettingsInput): Promise<Settings> => {
  return api.patch("/users/me", data);
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(["settings"], data);
      // Keep auth store in sync for areas that read from it
      useAuthStore.getState().updateUser({
        name: data.name,
        avatar: data.avatar,
      });
    },
  });
};
