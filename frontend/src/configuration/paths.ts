export const PATHS = {
  HOME: "/",
  LOGIN: {
    path: "/login",
    getHref: (redirectTo?: string | null | undefined) =>
      `/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
  },
  REGISTER: "/register",
  LOGOUT: "/auth/logout",
  IMAGE_GENERATION: "/image-generation",
};
