import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { CommandPalette } from "@/features/command-palette";
import { GlobalHotkeyBinder } from "@/features/hotkeys/components/global-hotkeys-manager";
import { SettingsModal } from "@/features/settings/components/modal/settings-modal.tsx";

interface UIStateContextType {
  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  navigateTo: (path: string) => void;

  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export function UIStateProvider({ children }: { children: ReactNode }) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleCommandPaletteNavigation = (path: string) => {
    navigate(path);
    setIsCommandPaletteOpen(false);
  };

  const value = useMemo(
    () => ({
      isSettingsModalOpen,
      openSettingsModal: () => setIsSettingsModalOpen(true),
      closeSettingsModal: () => setIsSettingsModalOpen(false),
      isCommandPaletteOpen,
      openCommandPalette: () => setIsCommandPaletteOpen(true),
      closeCommandPalette: () => setIsCommandPaletteOpen(false),
      navigateTo: handleCommandPaletteNavigation,
      isSidebarOpen,
      openSidebar: () => setIsSidebarOpen(true),
      closeSidebar: () => setIsSidebarOpen(false),
      toggleSidebar: () => setIsSidebarOpen((v) => !v),
      isMobileMenuOpen,
      openMobileMenu: () => setIsMobileMenuOpen(true),
      closeMobileMenu: () => setIsMobileMenuOpen(false),
      toggleMobileMenu: () => setIsMobileMenuOpen((v) => !v),
    }),
    [
      isSettingsModalOpen,
      isCommandPaletteOpen,
      isSidebarOpen,
      isMobileMenuOpen,
    ],
  );

  return (
    <UIStateContext.Provider value={value}>
      {children}
      <GlobalHotkeyBinder
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      {/* Modals are rendered here, controlled by the context's state */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        setActiveView={handleCommandPaletteNavigation}
      />
      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error("useUIState must be used within a UIStateProvider");
  }
  return context;
}
