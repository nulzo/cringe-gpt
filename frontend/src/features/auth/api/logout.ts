import { useMutation } from '@tanstack/react-query';
import { logout as logoutFn } from '@/lib/auth';

export const useLogout = (options?: Parameters<typeof useMutation<void, unknown, void>>[0]) =>
  useMutation<void, unknown, void>({
    mutationKey: ['auth', 'logout'],
    mutationFn: async () => {
      await logoutFn();
    },
    ...options,
  });



