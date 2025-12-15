import { useMutation } from "@tanstack/react-query";
import { register as registerService, type RegisterInput } from "@/lib/auth";

export const useRegister = (
  options?: Parameters<
    typeof useMutation<
      Awaited<ReturnType<typeof registerService>>,
      unknown,
      RegisterInput
    >
  >[0],
) =>
  useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: async (input: RegisterInput) => registerService(input),
    ...options,
  });

