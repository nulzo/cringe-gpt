import {useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api-client';
import {type ProviderType} from '@/features/chat/types';

export const getProviders = (): Promise<ProviderType[]> =>
    api.get('/providers');

export const useProviders = () =>
    useQuery<ProviderType[]>({
        queryKey: ['providers'],
        queryFn: getProviders,
        staleTime: 5 * 60 * 1000,
    });