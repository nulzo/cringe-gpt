import React, { Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18next-config";

interface I18nProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function I18nProvider({
  children,
  fallback = <div>Loading translations...</div>,
}: I18nProviderProps) {
  return (
    <Suspense fallback={fallback}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </Suspense>
  );
}

export default I18nProvider;
