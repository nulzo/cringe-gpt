import {useQuery} from '@tanstack/react-query';

import {api} from '@/lib/api-client';
import type {Settings} from '@/features/settings/types';

export const getSettings = (): Promise<Settings> => {
    return api.get('/users/me');
};

export const useSettings = () => {
    return useQuery({
        queryKey: ['settings'],
        queryFn: getSettings,
    });
};
