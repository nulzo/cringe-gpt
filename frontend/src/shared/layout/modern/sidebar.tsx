import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  TriangleDashIcon,
  Analytics01Icon,
  PencilEdit02Icon,
  PanelLeftIcon,
  Search01Icon,
  Tag01Icon,
  Archive03Icon,
  ArchiveOff03Icon,
  Logout01Icon,
  Github01Icon,
  LifebuoyIcon,
  Settings01Icon,
  Notification01Icon,
  CheckmarkBadge02Icon,
  Profile02Icon,
  MultiplicationSignIcon,
} from "@hugeicons/core-free-icons";
import { useUIState } from "@/shared/layout/ui-state-provider";
import { SidebarLink } from "./sidebar-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_VERSION } from "@/configuration/const";
import { CringeLogo } from "@/components/cringe";
import { useNavigate, useLocation } from "react-router-dom";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useConversations } from "@/features/chat/api/get-conversations";
import { useTags } from "@/features/chat/api/get-tags";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SidebarConversationItem } from "@/shared/layout/conversation-list-item";
import { PATHS } from "@/configuration/paths";
import { useLogout } from "@/features/auth/api/logout";

interface MenuItem {
  label: string;
  icon: IconSvgElement;
  route: string;
  exact?: boolean;
  onClick?: () => void;
  shortcut?: string;
}

export function Sidebar({ className }: { className?: string }) {
  const {
    isSidebarOpen: isOpen,
    toggleSidebar,
    openSettingsModal,
  } = useUIState();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogout({
    onSuccess: () => navigate(PATHS.LOGIN.path, { replace: true }),
  });

  // Conversation Filtering Logic
  const conversations = useConversations();
  const tagsQuery = useTags();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

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

  const menuItems: MenuItem[] = [
    {
      label: "New Chat",
      icon: PencilEdit02Icon,
      route: "/",
      exact: true,
      shortcut: "O",
    },
    { label: "Private Chat", icon: TriangleDashIcon, route: "/?temp=true" },
    { label: "Dashboard", icon: Analytics01Icon, route: "/analytics" },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={cn(
        "flex flex-col rounded-xl text-sidebar-foreground overflow-hidden h-full shadow-sm bg-background border border-border/50 transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0.2,1)] will-change-[width] p-3",
        isOpen ? "w-[280px]" : "w-[70px]",
        className,
      )}
    >
      {/* Header / Logo */}
      <div className="h-12 flex items-center mb-4 shrink-0">
        <div className="flex items-center w-full overflow-hidden">
          <TooltipProvider delayDuration={100}>
            <Tooltip open={isOpen ? false : undefined}>
              <TooltipTrigger asChild>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={!isOpen ? toggleSidebar : undefined}
                    className={cn(
                      "flex items-center justify-center w-[44px] h-[44px] shrink-0 outline-none",
                      isOpen
                        ? "cursor-default"
                        : "cursor-pointer logo-toggle-btn",
                    )}
                  >
                    {/* App Icon */}
                    <div
                      className={cn(
                        "flex items-center justify-center",
                        !isOpen && "group-hover:hidden",
                      )}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="pointer-events-none"
                      >
                        <CringeLogo className="size-6" />
                      </Button>
                    </div>

                    {/* Expand Icon (PanelLeft) - Only visible on hover when collapsed */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl bg-accent items-center justify-center text-accent-foreground hidden",
                        !isOpen && "group-hover:flex",
                      )}
                    >
                      <HugeiconsIcon
                        icon={PanelLeftIcon}
                        strokeWidth={2}
                        className="size-5"
                      />
                    </div>
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Open sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Text (Fades out) */}
          <div
            className={cn(
              "ml-3 flex-1 flex items-center justify-between min-w-0 transition-all duration-200 delay-50",
              isOpen
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-[10px] pointer-events-none delay-0",
            )}
          >
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-foreground text-sm">
                {APP_NAME}
              </span>
              <span className="text-primary text-xs">{APP_VERSION}</span>
            </div>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    title="Collapse Sidebar"
                  >
                    <HugeiconsIcon
                      icon={PanelLeftIcon}
                      strokeWidth={2}
                      className="size-5 text-muted-foreground"
                      data-icon="inline-start"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Close sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Main Content Area - includes static links and conversation list */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Static Navigation */}
        <nav className="space-y-1 shrink-0">
          <TooltipProvider delayDuration={100}>
            {menuItems.map((item) => (
              <div key={item.label}>
                <Tooltip open={isOpen ? false : undefined}>
                  <TooltipTrigger asChild>
                    <div>
                      <SidebarLink
                        to={item.route}
                        exact={item.exact}
                        icon={item.icon}
                        collapsed={!isOpen}
                        trailing={
                          item.shortcut && isOpen ? (
                            <kbd className="flex items-center gap-1 bg-muted opacity-100 px-1.5 border rounded h-5 font-mono font-medium text-[10px] pointer-events-none select-none text-muted-foreground">
                              <span className="text-xs">⌘</span>
                              {item.shortcut}
                            </kbd>
                          ) : null
                        }
                      >
                        {item.label}
                      </SidebarLink>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </TooltipProvider>
        </nav>

        {/* Divider */}
        <div className="h-px bg-border/50 my-4 shrink-0"></div>

        {/* Conversation List Section */}
        <div
          ref={parentRef}
          className={cn(
            "flex-1 overflow-y-auto min-h-0 scrollbar-none",
            // Hide scrollbar content when collapsed to prevent ugliness
            !isOpen && "invisible",
          )}
        >
          {isOpen && (
            <div className="flex flex-col min-h-full pb-2">
              {/* Search / Filter Header */}
              <div className="sticky top-0 bg-background z-10 space-y-2 pb-2">
                <div className="flex items-center gap-1">
                  <div className="relative flex-1">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5"
                    />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      className="h-8 pl-8 text-xs bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary/20 transition-colors placeholder:text-muted-foreground/70 rounded-lg"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <HugeiconsIcon
                          icon={MultiplicationSignIcon}
                          className="h-4 w-4 mr-2"
                        />
                      </button>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 text-muted-foreground hover:bg-muted/50 rounded-lg",
                          (tagFilters.length > 0 || showArchived) &&
                            "text-primary bg-primary/10 hover:bg-primary/20",
                        )}
                      >
                        <HugeiconsIcon icon={Tag01Icon} className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuCheckboxItem
                        checked={showArchived}
                        onCheckedChange={(c) => setShowArchived(!!c)}
                      >
                        <div className="flex items-center gap-2">
                          {showArchived ? (
                            <HugeiconsIcon
                              icon={ArchiveOff03Icon}
                              className="size-3.5"
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={Archive03Icon}
                              className="size-3.5"
                            />
                          )}
                          <span>Archived Chats</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Filter by Tag
                      </DropdownMenuLabel>
                      {tagsQuery.data?.map((tag) => (
                        <DropdownMenuCheckboxItem
                          key={tag.id}
                          checked={tagFilters.some(
                            (t) => t.toLowerCase() === tag.name.toLowerCase(),
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
                          <HugeiconsIcon
                            icon={MultiplicationSignIcon}
                            className="size-2.5"
                          />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversation Items */}
              <div className="flex-1 relative">
                {conversations.isLoading && (
                  <div className="text-xs text-muted-foreground px-1 py-1">
                    Loading…
                  </div>
                )}
                {!conversations.isLoading &&
                  filteredConversations.length === 0 && (
                    <div className="text-xs text-muted-foreground px-1 py-1 text-center mt-4">
                      {searchTerm ? "No results found" : "No conversations yet"}
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
                      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const item = filteredConversations[virtualItem.index];
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
                              isOpen={isOpen}
                              isActive={
                                location.pathname === `/chat/${item.id}`
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Footer */}
      <div className="mt-auto pt-2 border-t border-border/60 shrink-0">
        <DropdownMenu>
          <TooltipProvider delayDuration={100}>
            <Tooltip open={isOpen ? false : undefined}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full h-14 px-2 flex items-center gap-3 rounded-xl hover:bg-accent/60 transition-colors",
                      !isOpen ? "justify-center" : "justify-start",
                    )}
                  >
                    <Avatar className="size-8 rounded-full border-2 border-transparent bg-linear-to-tr from-blue-300 via-red-200 to-green-300 p-[2px]">
                      <AvatarImage src={user?.avatar || ""} />
                      <AvatarFallback>
                        {user?.name?.slice(0, 2).toUpperCase() || "NG"}
                      </AvatarFallback>
                    </Avatar>

                    {isOpen && (
                      <div className="flex flex-col min-w-0 text-left">
                        <p className="text-sm font-semibold text-foreground truncate leading-none">
                          {user?.name || "Guest User"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">
                {user?.name || "Guest User"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenuContent
            className="w-56"
            align="start"
            side="right"
            sideOffset={10}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <HugeiconsIcon icon={Profile02Icon} className="h-4 w-4 mr-2" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HugeiconsIcon
                icon={CheckmarkBadge02Icon}
                className="h-4 w-4 mr-2"
              />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HugeiconsIcon
                icon={Notification01Icon}
                className="h-4 w-4 mr-2"
              />
              <span>Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openSettingsModal}>
              <HugeiconsIcon icon={Settings01Icon} className="h-4 w-4 mr-2" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <HugeiconsIcon icon={LifebuoyIcon} className="h-4 w-4 mr-2" />
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HugeiconsIcon icon={Github01Icon} className="h-4 w-4 mr-2" />
              <span>Source Code</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
              <HugeiconsIcon icon={Logout01Icon} className="h-4 w-4 mr-2" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
