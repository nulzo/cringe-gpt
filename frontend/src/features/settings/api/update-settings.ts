import {useMutation, useQueryClient} from '@tanstack/react-query';

import {api} from '@/lib/api-client';
import type {Settings} from '@/features/settings/types';

export const updateSettings = (data: { settings: Partial<Settings['settings']> }): Promise<Settings> => {
    return api.patch('/users/me', data);
};

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSettings,
        onSuccess: (data) => {
            queryClient.setQueryData(['settings'], data);
        },
    });
};
