import { QueryClient } from '@tanstack/react-query';

const queryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});