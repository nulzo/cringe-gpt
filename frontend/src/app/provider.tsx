import React from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { I18nProvider } from "@/i18n";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Notifications from "@/components/notifications/notifications";
import { queryClient } from "@/lib/query";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/shared/ui/theme";
import { GlobalErrorAlert } from "@/shared/errors/error-alert";
import { ImageViewerProvider } from "@/context/image-viewer-context";
import { GlobalImageViewer } from "@/features/chat/components/global-image-viewer";
import { AnimationSyncEffect } from "@/shared/ui/animation-sync";
import { bootstrapAuthFromStorage } from "@/lib/auth";
import { useEffect } from 'react';
import { ensureNotificationsConnection } from '@/lib/signalr';
import { env } from '@/configuration/env';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Main App Provider
 *
 * Wraps the entire application with necessary providers including:
 * - I18n Provider for translations
 * - Add other providers here as needed (Theme, Auth, etc.)
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Ensure axios has Authorization if token exists
  bootstrapAuthFromStorage();
  useEffect(() => {
    const apiBase = import.meta.env.MODE === 'production' ? '/api' : env.API_URL;
    ensureNotificationsConnection(apiBase, () => localStorage.getItem('token'));
  }, []);
  return (
    <HelmetProvider>
      <I18nProvider
        fallback={
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
              <div className="mx-auto mb-4 border-b-2 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
              <p className="text-gray-600">Loading translations...</p>
            </div>
          </div>
        }
      >
        <AnimationSyncEffect />
        <GlobalErrorAlert />
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <QueryClientProvider client={queryClient}>
            <ImageViewerProvider>
              <TooltipProvider delayDuration={100}>
                {import.meta.env.DEV && <ReactQueryDevtools />}
                {children}
                <Toaster />
                <Notifications />
                <GlobalImageViewer />
              </TooltipProvider>
            </ImageViewerProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </I18nProvider>
    </HelmetProvider>
  );
};

export default AppProvider;
