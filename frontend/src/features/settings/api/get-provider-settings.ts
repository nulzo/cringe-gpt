import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { type ProviderType } from '@/features/chat/types';

export interface ProviderSettings {
  apiKey?: string;
  defaultModel?: string;
  apiUrl?: string;
}

const getProviderSettings = (
  provider: ProviderType,
): Promise<ProviderSettings> =>
  api.get(`/providers/me/credentials/${provider}`);

export const useProviderSettings = (provider: ProviderType) =>
  useQuery<ProviderSettings, Error>({
    queryKey: ['providerSettings', provider],
    queryFn: () => getProviderSettings(provider),
    enabled: !!provider, // don’t fire while provider is undefined
    staleTime: 5 * 60 * 1000,
  });