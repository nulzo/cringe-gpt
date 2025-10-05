import {useQuery, type UseQueryOptions, type UseQueryResult} from '@tanstack/react-query';
import {useDelayedLoading} from '@/hooks/use-delayed-loading';

export function useSmartQuery<TQueryFnData, TError = unknown, TData = TQueryFnData>(
    key: any[],
    queryFn: () => Promise<TQueryFnData>,
    options?: UseQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> & { delayedLoading: boolean } {
    const query = useQuery<TQueryFnData, TError, TData>(key, queryFn, options);
    const delayedLoading = useDelayedLoading(query.isLoading);

    return {...query, delayedLoading};
}
