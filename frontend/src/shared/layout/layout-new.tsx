import { Outlet } from "react-router-dom";
import { UIStateProvider, useUIState } from "./ui-state-provider";
import { GlobalHotkeyBinder } from "@/features/hotkeys/components/global-hotkeys-manager";
import { Sidebar } from "./sidebar";

// Hotkey manager needs access to context, so we create a small inner component
function HotkeyManager() {
  const { openCommandPalette } = useUIState();
  return <GlobalHotkeyBinder onOpenCommandPalette={openCommandPalette} />;
}

// The main layout component is now a clean wrapper
function AppLayout() {
  return (
    <>
      <HotkeyManager />
      <div className="h-screen w-screen max-h-screen overflow-hidden flex flex-col">
        <div className="flex flex-1 bg-sidebar overflow-hidden">
          <Sidebar />
          <main className="flex-1 bg-background mb-4 mr-4 rounded-lg overflow-hidden">
            <div className="h-full w-full overflow-y-auto p-1">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// The final export wraps the layout with the necessary provider
export function Layout() {
  return (
    <UIStateProvider>
      <AppLayout />
    </UIStateProvider>
  );
}
