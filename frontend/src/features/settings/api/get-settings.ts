import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Settings } from '@/features/settings/types';
import { useAuthStore } from '@/stores/auth-store';

const getSettings = (): Promise<Settings> => api.get('/users/me');

export const useSettings = () => {
  const token = useAuthStore((s) => s.token);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    enabled: Boolean(token && isInitialized),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
