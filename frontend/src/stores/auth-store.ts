import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type UserDto } from "@/DTOs/auth";

export interface AuthState {
  user: UserDto | null;
  token: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  setAuth: (user: UserDto, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  updateUser: (userData: Partial<UserDto>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isInitialized: false,
      isLoading: false,
      setAuth: (user, token) =>
        set({ user, token, isLoading: false, isInitialized: true }),
      clearAuth: () => {
        try {
          localStorage.removeItem("token");
        } catch {}
        return set({
          user: null,
          token: null,
          isLoading: false,
          isInitialized: true,
        });
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: "auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);
