"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";
import {
  IconActivity,
  IconCalendar,
  IconInbox,
  IconMoon,
  IconSearch,
  IconSettings,
  IconSun,
  IconTerminal2,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useConversationSearch } from "@/features/chat/api/search-conversations";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setActiveView: (path: string) => void;
}

// animations handled by Radix Dialog; optional framer presence kept for mount/unmount

export function CommandPalette({
  open,
  onOpenChange,
  setActiveView,
}: CommandPaletteProps) {
  const { setTheme } = useTheme();
  const [search, setSearch] = React.useState("");
  const navigate = useNavigate();
  const searchEnabled = search.trim().length > 0;
  const searchQuery = useConversationSearch(search);

  React.useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open]);

  const runCommand = (command: () => void) => {
    command();
    onOpenChange(false);
  };

  const handleNavigation = (path: string) => {
    setActiveView(path);
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <CommandDialog
          open={open}
          onOpenChange={onOpenChange}
          className="w-full max-w-lg"
        >
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder="Type a command or search..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Navigation">
              <CommandItem
                onSelect={() => handleNavigation("/inbox")}
                value="Navigate Inbox"
              >
                <IconInbox className="mr-2 h-4 w-4" />
                <span>Inbox</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigation("/activity")}
                value="Navigate Activity"
              >
                <IconActivity className="mr-2 h-4 w-4" />
                <span>Activity</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigation("/schedule")}
                value="Navigate Schedule"
              >
                <IconCalendar className="mr-2 h-4 w-4" />
                <span>Schedule</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigation("/terminal")}
                value="Navigate Terminal Logs"
              >
                <IconTerminal2 className="mr-2 h-4 w-4" />
                <span>Terminal Logs</span>
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() => runCommand(() => setTheme("light"))}
                value="Set Light Theme"
              >
                <IconSun className="mr-2 h-4 w-4" />
                <span>Set Light Theme</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => setTheme("dark"))}
                value="Set Dark Theme"
              >
                <IconMoon className="mr-2 h-4 w-4" />
                <span>Set Dark Theme</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => setTheme("system"))}
                value="Set System Theme"
              >
                <IconSettings className="mr-2 h-4 w-4" />
                <span>Set System Theme</span>
              </CommandItem>
            </CommandGroup>

            {searchEnabled && (
              <CommandGroup heading="Conversations">
                {searchQuery.isLoading && (
                  <CommandItem value="Searching…">
                    <span>Searching…</span>
                  </CommandItem>
                )}
                {!searchQuery.isLoading &&
                  searchQuery.data?.pages?.flatMap((p) => p.items).length ===
                    0 && (
                    <CommandItem value={search} disabled>
                      <span>No conversations match "{search}"</span>
                    </CommandItem>
                  )}
                {searchQuery.data?.pages
                  ?.flatMap((p) => p.items)
                  .map((item) => (
                    <CommandItem
                      key={`${item.id}-${item.payload.message_id ?? "title"}`}
                      value={`${item.title} ${item.payload?.snippet ?? ""}`}
                      onSelect={() => {
                        const messageParam = item.payload?.message_id
                          ? `?messageId=${encodeURIComponent(item.payload.message_id)}`
                          : "";
                        navigate(`/chat/${item.id}${messageParam}`);
                        onOpenChange(false);
                      }}
                    >
                      <div className="mr-2 h-4 w-4 shrink-0 opacity-60">
                        <IconSearch className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm">{item.title}</span>
                        {item.payload?.snippet && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {item.payload.snippet}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                {searchQuery.hasNextPage && (
                  <CommandItem
                    value="Load more"
                    onSelect={() => searchQuery.fetchNextPage()}
                  >
                    Load more…
                  </CommandItem>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      )}
    </AnimatePresence>
  );
}
