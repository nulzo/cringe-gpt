import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";
import App from "@/App";
import { Layout } from "@/shared/layout/layout";
import { UIStateProvider } from "@/shared/layout/ui-state-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PATHS } from "@/configuration/paths";
import { IconLoader2 } from "@tabler/icons-react";
import { ChatRoute } from "@/app/routes/chat.tsx";
import { Analytics } from "@/app/routes/analytics.tsx";
import { useAuthStore } from "@/stores/auth-store";

const NotFound = lazy(() => import("@/app/routes/not-found"));

const ImageGenerationPage = lazy(
  () => import("@/features/image-generation/routes/image-generation-page")
);

const DashboardPage = lazy(
  () => import("@/features/dashboard/routes/dashboard-page")
);

const AppLayout = () => (
  <UIStateProvider>
    <SidebarProvider>
      <Suspense
        fallback={
          <div className="flex justify-center items-center w-full h-full">
            <IconLoader2 size={64} className="animate-spin" />
          </div>
        }
      >
        <Layout />
      </Suspense>
    </SidebarProvider>
  </UIStateProvider>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.token);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const location = useLocation();
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <IconLoader2 size={48} className="animate-spin" />
      </div>
    );
  }
  if (!token) {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate to={PATHS.LOGIN.getHref(redirectTo)} replace />;
  }
  return <>{children}</>;
};

const AuthRoutes = {
  element: (
    <Suspense
      fallback={
        <div className="flex justify-center items-center w-full h-full">
          Loading Page...
        </div>
      }
    >
      <Outlet />
    </Suspense>
  ),
  children: [
    {
      path: "login",
      lazy: async () => {
        const { LoginRoute } = await import("@/app/routes/auth/login");
        return { Component: LoginRoute };
      },
    },
    {
      path: "register",
      lazy: async () => {
        const { RegisterRoute } = await import("@/app/routes/auth/register");
        return { Component: RegisterRoute };
      },
    },
    {
      path: "logout",
      lazy: async () => {
        const { LogoutRoute } = await import("@/app/routes/auth/logout");
        return { Component: LogoutRoute };
      },
    },
  ],
};

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      AuthRoutes,
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <ChatRoute />,
          },
          {
            path: "chat/:conversationId",
            element: <ChatRoute />,
          },
          {
            path: PATHS.IMAGE_GENERATION,
            element: <ImageGenerationPage />,
          },
          {
            path: "analytics",
            element: <Analytics />,
          },
          {
            path: PATHS.DASHBOARD.slice(1), // Remove leading slash
            element: <DashboardPage />,
          },
        ],
      },
      {
        path: "*",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
]);
