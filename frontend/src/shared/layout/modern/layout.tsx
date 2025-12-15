import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useUIState } from "@/shared/layout/ui-state-provider";
import { Outlet, useLocation } from "react-router-dom";
import { CommandPalette } from "@/features/command-palette";
import { SettingsModal } from "@/features/settings/components/modal/settings-modal.tsx";
import { Head } from "@/shared/layout/head";
import { useConversations } from "@/features/chat/api/get-conversations";
import { useMemo } from "react";

export function Layout() {
  const {
    isMobileMenuOpen,
    closeMobileMenu,
    isCommandPaletteOpen,
    isSettingsModalOpen,
    openSettingsModal,
    closeSettingsModal,
    openCommandPalette,
    closeCommandPalette,
    navigateTo,
  } = useUIState();

  const conversations = useConversations();
  const location = useLocation();

  const pageTitle = useMemo(() => {
    if (
      location.pathname.startsWith("/dashboard") ||
      location.pathname.startsWith("/analytics")
    )
      return "Dashboard";
    if (location.pathname.startsWith("/image-generation"))
      return "Image Generation";
    if (location.pathname.startsWith("/chat")) {
      const id = location.pathname.split("/")[2];
      const numericId = Number(id);
      const convo = conversations.data?.find((c) => c.id === numericId);
      return convo?.title ?? "Chat";
    }
    if (location.pathname === "/" && location.search.includes("temp=true"))
      return "Private Chat";
    if (location.pathname === "/") return "New Chat";

    // Fallback – show app name only
    return undefined;
  }, [location.pathname, location.search, conversations.data]);

  return (
    <>
      <Head title={pageTitle} />
      <div className="flex h-screen w-screen overflow-hidden bg-sidebar text-foreground">
        {/* Sidebar (Desktop) */}
        <div className="hidden lg:block h-full z-20 p-3 pr-0">
          <Sidebar className="h-full" />
        </div>

        {/* Sidebar (Mobile) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="relative flex-1 w-full max-w-xs p-3">
              <Sidebar className="h-full shadow-2xl" />
            </div>
            <div
              className="flex-1 bg-black/20 backdrop-blur-sm"
              onClick={closeMobileMenu}
            ></div>
          </div>
        )}

        <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0">
          {/* Header Container with margin to match sidebar */}
          {/* <div className="px-3 pt-3 pb-0">
            <Header />
          </div> */}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-3 scrollbar">
            <div className="mx-auto max-w-full bg-background p-4 md:p-8 xl:px-12 rounded-xl h-full animate-fade shadow-sm border border-border/50 overflow-y-scroll">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={(open) =>
          open ? openCommandPalette() : closeCommandPalette()
        }
        setActiveView={navigateTo}
      />
      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={(open) =>
          open ? openSettingsModal() : closeSettingsModal()
        }
      />
    </>
  );
}

