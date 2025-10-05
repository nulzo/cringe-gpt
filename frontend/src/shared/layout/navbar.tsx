import {
  IconBrandGithubFilled,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
// import { useNotifications } from '@/context/notification-context';
import { useUIState } from "@/shared/layout/ui-state-provider";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Navbar() {
  const { openSettingsModal, openCommandPalette } = useUIState();
  // const {
  //     notifications,
  //     markAllAsRead,
  //     dismissNotification,
  //     hasUnread,
  //     unreadCount,
  // } = useNotifications();

  const handlePopoverOpenChange = (open: boolean) => {
    // if (open && hasUnread) {
    //     markAllAsRead();
    // }
  };

  return (
    <nav className="h-[55px] bg-sidebar pl-4 pr-8 grid grid-cols-3 items-center flex-shrink-0">
      {/* Left Section (Menu Toggle) */}
      <div className="justify-self-start flex items-center gap-8">
        <SidebarTrigger />
      </div>

      {/* Center Section (Command Palette Trigger) */}
      <div className="justify-self-center">
        <Button
          variant="outline"
          className="w-[500px] justify-start text-sm text-muted-foreground"
          onClick={() => openCommandPalette()}
        >
          <IconSearch className="mr-2 h-4 w-4" />
          Search or type command...
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      {/* Right Section (Settings, Notifications, etc.) */}
      <div className="flex gap-2 items-center justify-self-end text-foreground">
        {/* Settings Button */}
        <Button variant="ghost" size="icon" onClick={openSettingsModal}>
          <IconSettings size={24} />
        </Button>
        {/* Notifications Popover */}
        {/* <Popover onOpenChange={handlePopoverOpenChange}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            {hasUnread && (
                                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                                </span>
                            )}
                            <IconBell size={24} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 mr-4">
                        <div className="p-4 border-b">
                            <h4 className="font-medium leading-none">Notifications</h4>
                            <p className="text-sm text-muted-foreground">
                                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "No unread messages"}
                            </p>
                        </div>
                        <ScrollArea className="h-72">
                            <div className="p-4 space-y-4">
                                {notifications.length === 0 ? (
                                    <p className="text-sm text-center text-muted-foreground py-4">No notifications yet.</p>
                                ) : (
                                    notifications.map((notification) => (
                                        <div key={notification.id} className="flex items-start gap-3">
                                            <div>
                                                {notification.type === "error" && <IconX className="h-5 w-5 text-destructive" />}
                                                {notification.type === "alert" && <IconAlertTriangle className="h-5 w-5 text-yellow-500" />}
                                                {notification.type === "info" && <IconInfoCircle className="h-5 w-5 text-blue-500" />}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                    onClick={() => dismissNotification(notification.id)} aria-label="Dismiss notification">
                                                <IconX size={16} />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover> */}
        {/* GitHub Link Button */}
        <Button variant="ghost" size="icon">
          <IconBrandGithubFilled size={24} />
        </Button>
      </div>
    </nav>
  );
}
