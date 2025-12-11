import { useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  IconChartHistogram,
  IconGhost2,
  IconLayoutSidebar,
  IconLifebuoy,
  IconMenu2,
  IconMessagePlus,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SettingsModal } from "@/features/settings/components/modal/settings-modal.tsx";
import { CommandPalette } from "@/features/command-palette";
import { APP_NAME, APP_VERSION } from "@/configuration/const";
import { useConversations } from "@/features/chat/api/get-conversations";
import { Head } from "@/shared/layout/head";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/api/get-settings";
import { NavUser } from "@/shared/layout/nav-user";
import { CringeLogo } from "@/components/cringe";
import { useAnimationStore } from "@/stores/animation-store";
import { SidebarConversationItem } from "@/shared/layout/conversation-list-item";

const sidebarHeaderLinks = [
  {
    id: "chat",
    name: "New Chat",
    icon: IconMessagePlus,
    path: "/",
    shortcut: "O",
  },
  {
    id: "temp-chat",
    name: "Private Chat",
    icon: IconGhost2,
    path: "/?temp=true",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    icon: IconChartHistogram,
    path: "/analytics",
  },
  { id: "search", name: "Search", icon: IconSearch },
];

const SIDEBAR_TRANSITION_DURATION = 240;

type SidebarItem = {
  id: string;
  name: string;
  icon: any;
  path?: string;
  shortcut?: string;
  fn?: () => void;
};

const SidebarNavButton = ({ item, isOpen }: { item: SidebarItem; isOpen: boolean }) => {
  const Icon = item.icon;
  const location = useLocation();

  // More specific active check
  const isActive =
    item.path === "/"
      ? location.pathname === "/" && !location.search.includes("temp=true")
      : item.path === "/?temp=true"
      ? location.pathname === "/" && location.search.includes("temp=true")
      : item.path && location.pathname.startsWith(item.path);

  const commonClasses = `hover:bg-sidebar-hover group/sidebar-nav-button flex items-center w-full h-9 rounded-md text-sm font-base text-foreground group relative overflow-hidden`;

  const element = (
    <Link to={item.path} className={commonClasses}>
      <div className={`w-[56px] h-full flex-shrink-0 flex items-center justify-center z-10`}>
        <Icon className="size-5 text-foreground/90" />
      </div>
      <div
        className={`flex-1 flex items-center justify-between whitespace-nowrap overflow-hidden z-10
                                                           ${
                                                             isOpen
                                                               ? "opacity-100 translate-x-0"
                                                               : "opacity-0 -translate-x-2"
                                                           }
                                                           `}
      >
        <span>
          {item.name}
        </span>
        {item.shortcut && (
          <div className="group-hover/sidebar-nav-button:opacity-100 text-muted-foreground text-sm flex items-center gap-1 opacity-0 mr-2 px-1.5 rounded h-5 font-medium text-[10px] pointer-events-none select-none">
            <span className="">⌘</span>
            <span className="">{item.shortcut}</span>
          </div>
        )}
      </div>
    </Link>
  );

  return (
    <Tooltip key={item.id} disableHoverableContent={isOpen}>
      <TooltipTrigger asChild>{element}</TooltipTrigger>
      {!isOpen && (
        <TooltipContent side="right" sideOffset={4}>
          <p>{item.name}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { animationsEnabled } = useAnimationStore();
  const conversations = useConversations();
  const navigate = useNavigate();
  const { data } = useSettings();


    
    const location = useLocation();
    const pageTitle = useMemo(() => {
        if (location.pathname.startsWith("/dashboard")) return "Dashboard";
        if (location.pathname.startsWith("/image-generation")) return "Image Generation";
        if (location.pathname.startsWith("/chat")){
            const id = location.pathname.split("/")[2];
            const numericId = Number(id);
            const convo = conversations.data?.find(c => c.id === numericId);
            return convo?.title ?? "Chat";
        }
        if (location.pathname === "/" && location.search.includes("temp=true"))
            return "Private Chat";
        if (location.pathname === "/") return "New Chat";

        // Fallback – show app name only
        return undefined;
    }, [location.pathname, location.search]);

  const openSettingsModal = () => {
    setIsSettingsModalOpen(!isSettingsModalOpen);
  };

  const bottomNavItems = [
    {
      id: "settings_trigger",
      name: "Settings",
      icon: IconSettings,
      fn: openSettingsModal,
    },
    { id: "help", name: "Help", icon: IconLifebuoy, path: "/help" },
  ];

  const transitionDuration = animationsEnabled
    ? SIDEBAR_TRANSITION_DURATION
    : 0;

  const handleCommandPaletteNavigation = (path: string) => {
    navigate(path);
    setIsCommandPaletteOpen(false);
  };

  return (
    <>
        <Head title={pageTitle} />
      <div className="flex flex-col w-screen h-screen max-h-screen overflow-hidden">

        {/* --- Main Content Area --- */}
        <div className="flex flex-1 bg-sidebar overflow-hidden">
          {/* --- SIDEBAR --- */}
          <aside
            className={cn(
              "h-full flex flex-col flex-shrink-0 border-r border-border/40 bg-sidebar",
              "transition-[width] ease-in-out will-change-[width]",
              isSidebarOpen ? "w-[256px]" : "w-[72px]"
            )}
            style={{ transitionDuration: `${transitionDuration}ms` }}
            aria-expanded={isSidebarOpen}
          >
            {/* Header - Fixed at top */}
            <div className="top-0 z-10 sticky flex-shrink-0 bg-sidebar">
              <div className="flex items-center gap-1 mt-2 px-2 h-16">
                {/* Logo or Toggle Button */}
                <div className="flex justify-center items-center w-12 h-12">
                  {isSidebarOpen ? (
                    <CringeLogo className="ml-3 size-6" />
                  ) : (
                    <Button
                      onClick={() => setIsSidebarOpen(true)}
                      variant="ghost"
                      className="ml-2 text-foreground"
                    >
                      <IconMenu2 size={24} />
                    </Button>
                  )}
                </div>

                {/* App Name and Collapse Button (only when open) */}
                <div
                  className={cn(
                    "flex items-center justify-between flex-1 overflow-hidden",
                    isSidebarOpen
                      ? "opacity-100 ml-2 translate-x-0"
                      : "opacity-0 ml-0 -translate-x-2 pointer-events-none"
                  )}
                  style={{
                    transitionDuration: `${transitionDuration}ms`,
                    transitionDelay: isSidebarOpen ? "100ms" : "0ms",
                  }}
                >
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-foreground text-sm">
                      {APP_NAME}
                    </span>
                    <span className="text-primary text-xs">{APP_VERSION}</span>
                  </div>
                  <Button
                    onClick={() => setIsSidebarOpen(false)}
                    variant="ghost"
                    size="icon"
                    className="mr-1 text-foreground"
                  >
                    <IconLayoutSidebar size={24} />
                  </Button>
                </div>
              </div>
              <div className="mx-2 bg-border h-[1px]" />

              <div className="space-y-1 p-2">
                {/* Sidebar HEader links */}
                {sidebarHeaderLinks.map((item) => {
                  if (item.id === "search") {
                    const Icon = item.icon;
                    const commonClasses = `flex items-center w-full h-9 rounded text-sm font-base text-muted-foreground group relative overflow-hidden`;

                    const element = (
                      <button
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className={commonClasses}
                      >
                        <div
                          className={`absolute left-0 top-0 h-full rounded-md group-hover:bg-sidebar-hover ease-in-out`}
                          style={{
                            left: isSidebarOpen ? "0px" : "8px",
                            width: isSidebarOpen ? "100%" : "40px",
                          }}
                        ></div>
                        <div
                          className={`w-[56px] h-full flex-shrink-0 flex items-center justify-center z-10 text-muted-foreground group-hover:text-foreground`}
                        >
                          <Icon size={18} />
                        </div>
                        <div
                          className={`flex-1 flex items-center justify-between whitespace-nowrap overflow-hidden z-10 ${
                            isSidebarOpen
                              ? "opacity-100 translate-x-0"
                              : "opacity-0 -translate-x-2"
                          } `}
                          style={{
                          }}
                        >
                          <span className={`group-hover:text-foreground`}>
                            {item.name}
                          </span>
                          <kbd className="flex items-center gap-1 bg-muted opacity-100 mr-2 px-1.5 border rounded h-5 font-mono font-medium text-[10px] pointer-events-none select-none">
                            <span className="text-xs">⌘</span>K
                          </kbd>
                        </div>
                      </button>
                    );
                    return (
                      <Tooltip
                        key={item.id}
                        disableHoverableContent={isSidebarOpen}
                      >
                        <TooltipTrigger asChild>{element}</TooltipTrigger>
                        {!isSidebarOpen && (
                          <TooltipContent side="right" sideOffset={4}>
                            <p>{item.name}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  }
                  return (
                    <SidebarNavButton
                      key={item.id}
                      isOpen={isSidebarOpen}
                      item={item}
                    />
                  );
                })}
              </div>
              <div className="mx-2 bg-border h-[1px]" />
            </div>

            {/* Main scrollable area (converastions) */}
            <div
              className={cn(
                "overflow-auto transition-[opacity] ease-in-out",
                isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              style={{
                height: "calc(100% - 80px)",
                maxHeight: "calc(100% - 80px)",
                transitionDuration: `${transitionDuration}ms`,
              }}
            >
              {isSidebarOpen && (
                <nav className="p-2">
                  <div key="conversations" className="mb-2">
                    <div className="px-3 h-8 flex items-center justify-between">
                      <div className="overflow-hidden text-[12px] text-muted-foreground/75 whitespace-nowrap select-none">
                        Conversations
                      </div>
                    </div>

                    <div className="space-y-1">
                      {conversations.isLoading && <div className="text-xs text-muted-foreground px-3 py-1">Loading…</div>}
                      {!conversations.isLoading &&
                        conversations.data &&
                        conversations.data.map((item) => (
                          <SidebarConversationItem
                            conversation={item}
                            key={item.id}
                            isOpen={isSidebarOpen}
                            isActive={window.location.pathname === `/chat/${item.id}`}
                          />
                        ))}
                    </div>
                  </div>
                </nav>
              )}
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="bottom-0 z-10 sticky flex-shrink-0 bg-sidebar">
              <div className="mx-2 bg-border h-[1.5px]" />

              <div className={`px-2 pt-2 pb-2 mb-4`}>

                {/* User Profile */}
                <NavUser
                  user={{
                    name: data?.name || "Guest",
                    email: data?.email || "guest@example.com",
                    avatar: data?.avatar || "",
                  }}
                  isOpen={isSidebarOpen}
                />
              </div>
            </div>
          </aside>

          {/* --- PAGE CONTENT --- */}
          <main className="flex-1 bg-background my-5 mr-5 rounded-lg overflow-hidden">
            <div className="p-1 w-full h-full overflow-y-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Render Modals and Command Palette (controlled by state within Layout) */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        setActiveView={handleCommandPaletteNavigation}
      />
      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </>
  );
}

// Optional: Export component for App.tsx
// export default Layout;