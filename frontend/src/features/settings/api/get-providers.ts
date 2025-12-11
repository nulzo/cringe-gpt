import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { type ProviderType } from '@/features/chat/types';

const getProviders = (): Promise<ProviderType[]> =>
    api.get('/providers');

export const useProviders = (
    options?: Partial<UseQueryOptions<ProviderType[], Error>>
) =>
    useQuery<ProviderType[]>({
        queryKey: ['providers'],
        queryFn: getProviders,
        staleTime: 5 * 60 * 1000,
        ...options,
    });