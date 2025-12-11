import {useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api-client';
import {type ModelResponse} from '@/types/api';

const getModels = (): Promise<Array<ModelResponse>> => {
    return api.get(`/models`);
};

export const useModels = () => {
    return useQuery<Array<ModelResponse>, Error>({
        queryKey: ['models'],
        queryFn: () => getModels()
    });
};
