import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ModelResponse } from '@/types/api';
import type { ProviderType } from '@/features/chat/types';

export const getModelsByProvider = (provider: ProviderType): Promise<Array<ModelResponse>> => {
  const search = new URLSearchParams();
  search.set('provider', provider as string);
  return api.get(`/models?${search.toString()}`);
};

export const useModelsByProvider = (provider?: ProviderType) => {
  return useQuery<Array<ModelResponse>, Error>({
    queryKey: ['models', { provider }],
    queryFn: () => getModelsByProvider(provider as ProviderType),
    enabled: !!provider,
    staleTime: 5 * 60 * 1000,
  });
};


