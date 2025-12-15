import { useMemo, useState, useDeferredValue, useRef } from "react";
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
  IconArchive,
  IconTag,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTags } from "@/features/chat/api/get-tags";
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

const SidebarNavButton = ({
  item,
  isOpen,
}: {
  item: SidebarItem;
  isOpen: boolean;
}) => {
  if (!item.path) return null;

  const Icon = item.icon;
  const location = useLocation();

  // More specific active check
  const isActive =
    item.path === "/"
      ? location.pathname === "/" && !location.search.includes("temp=true")
      : item.path === "/?temp=true"
        ? location.pathname === "/" && location.search.includes("temp=true")
        : item.path && location.pathname.startsWith(item.path);

  const commonClasses = cn(
    "group/sidebar-nav-button flex items-center w-full h-9 rounded-md text-sm font-base text-foreground group relative overflow-hidden",
    isActive && "bg-sidebar-hover/75",
  );

  const element = (
    <Link to={item.path} className={commonClasses}>
      <div
        className="absolute left-0 top-0 h-full rounded-md group-hover:bg-sidebar-hover ease-in-out"
        style={{
          left: isOpen ? "0px" : "8px",
          width: isOpen ? "100%" : "40px",
          transitionDuration: `${SIDEBAR_TRANSITION_DURATION}ms`,
        }}
      />
      <div className="w-[56px] h-full flex-shrink-0 flex items-center justify-center z-10">
        <Icon className="size-5 text-foreground/90 group-hover/sidebar-nav-button:text-foreground" />
      </div>
      <div
        className={`flex-1 flex items-center justify-between whitespace-nowrap overflow-hidden z-10 transition-all ${
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
        }`}
        style={{ transitionDuration: `${SIDEBAR_TRANSITION_DURATION}ms` }}
      >
        <span>{item.name}</span>
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
  const tagsQuery = useTags();
  const navigate = useNavigate();
  const { data } = useSettings();

  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/dashboard")) return "Dashboard";
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

  const toggleTag = (tag: string) => {
    setTagFilters((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === tag.toLowerCase());
      return exists
        ? prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag];
    });
  };

  const filteredConversations = useMemo(() => {
    if (!conversations.data) return [];
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const tagSet = new Set(tagFilters.map((t) => t.toLowerCase()));

    return conversations.data
      .filter((c) => (showArchived ? true : !(c.isHidden ?? c.is_hidden)))
      .filter((c) => {
        if (!normalizedSearch) return true;
        return (c.title ?? "").toLowerCase().includes(normalizedSearch);
      })
      .filter((c) => {
        if (tagSet.size === 0) return true;
        const names = (c.tags ?? [])
          .map((t: any) => t?.name?.toLowerCase?.())
          .filter(Boolean);
        return names.some((n) => tagSet.has(n as string));
      })
      .sort((a, b) => {
        const pinnedA = ((a as any).isPinned ?? (a as any).is_pinned) ? 1 : 0;
        const pinnedB = ((b as any).isPinned ?? (b as any).is_pinned) ? 1 : 0;
        if (pinnedA !== pinnedB) return pinnedB - pinnedA;
        const dateA = new Date(
          (a as any).updated_at ?? (a as any).updatedAt ?? 0,
        ).getTime();
        const dateB = new Date(
          (b as any).updated_at ?? (b as any).updatedAt ?? 0,
        ).getTime();
        return dateB - dateA;
      });
  }, [conversations.data, deferredSearch, tagFilters, showArchived]);

  const rowVirtualizer = useVirtualizer({
    count: filteredConversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

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
              isSidebarOpen ? "w-[256px]" : "w-[72px]",
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
                      : "opacity-0 ml-0 -translate-x-2 pointer-events-none",
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
                          style={{}}
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

            {/* Main scrollable area (conversations) */}
            <div
              ref={parentRef}
              className={cn(
                "overflow-y-auto overflow-x-hidden flex-1",
                isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
              style={{
                transitionDuration: `${transitionDuration}ms`,
              }}
              aria-hidden={!isSidebarOpen}
            >
              {isSidebarOpen && (
                <div className="flex flex-col min-h-full">
                  {/* Search / Filter Header */}
                  <div className="px-3 py-2 sticky top-0 bg-sidebar z-10 space-y-2">
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                        <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
                        <Input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search..."
                          className="h-7 pl-7 text-xs bg-sidebar-accent/50 border-transparent focus-visible:bg-background focus-visible:border-border transition-colors placeholder:text-muted-foreground/70"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <IconX className="size-3" />
                          </button>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 text-muted-foreground",
                              (tagFilters.length > 0 || showArchived) &&
                                "text-primary bg-sidebar-accent",
                            )}
                          >
                            <IconTag className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuCheckboxItem
                            checked={showArchived}
                            onCheckedChange={(c) => setShowArchived(!!c)}
                          >
                            <div className="flex items-center gap-2">
                              <IconArchive className="size-3.5" />
                              <span>Archived Chats</span>
                            </div>
                          </DropdownMenuCheckboxItem>
                          <div className="h-[1px] bg-border my-1" />
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            Filter by Tag
                          </div>
                          {tagsQuery.data?.map((tag) => (
                            <DropdownMenuCheckboxItem
                              key={tag.id}
                              checked={tagFilters.some(
                                (t) =>
                                  t.toLowerCase() === tag.name.toLowerCase(),
                              )}
                              onCheckedChange={() => toggleTag(tag.name)}
                            >
                              {tag.name}
                            </DropdownMenuCheckboxItem>
                          ))}
                          {!tagsQuery.isLoading &&
                            (tagsQuery.data?.length ?? 0) === 0 && (
                              <div className="px-2 py-1 text-xs text-muted-foreground">
                                No tags available
                              </div>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {tagFilters.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tagFilters.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className="hover:text-foreground"
                            >
                              <IconX className="size-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <nav className="px-2 pb-2 flex-1 relative">
                    {conversations.isLoading && (
                      <div className="text-xs text-muted-foreground px-3 py-1">
                        Loading…
                      </div>
                    )}
                    {!conversations.isLoading &&
                      filteredConversations.length === 0 && (
                        <div className="text-xs text-muted-foreground px-3 py-1 text-center mt-4">
                          {searchTerm
                            ? "No results found"
                            : "No conversations yet"}
                        </div>
                      )}

                    {!conversations.isLoading &&
                      filteredConversations.length > 0 && (
                        <div
                          style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative",
                          }}
                        >
                          {rowVirtualizer
                            .getVirtualItems()
                            .map((virtualItem) => {
                              const item =
                                filteredConversations[virtualItem.index];
                              return (
                                <div
                                  key={item.id}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                  }}
                                >
                                  <SidebarConversationItem
                                    conversation={item}
                                    isOpen={isSidebarOpen}
                                    isActive={
                                      location.pathname === `/chat/${item.id}`
                                    }
                                  />
                                </div>
                              );
                            })}
                        </div>
                      )}
                  </nav>
                </div>
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
