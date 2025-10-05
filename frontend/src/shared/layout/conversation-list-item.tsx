import type { Conversation } from "@/features/chat/types";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useChatStore } from '@/features/chat/stores/chat-store';
import { memo, useCallback } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IconArchive, IconDots, IconPencil, IconTrash } from "@tabler/icons-react";

interface SidebarConversationItemProps {
  conversation: Conversation;
  /** if the sidebar is collapsed – affects hover styles but not required here */
  isOpen: boolean;
  /** pathname check supplied by parent */
  isActive?: boolean;
}

export const SidebarConversationItem = memo(
  function SidebarConversationItem({
    conversation,
    isOpen,
    isActive = false,
  }: SidebarConversationItemProps) {
    const navigate = useNavigate();
    const to = `/chat/${conversation.id}`;

    const handleDelete = async () => {
      /* TODO – wire up delete later */
    };

    const handleRowClick = useCallback(() => {
      if (!isOpen) return; // disable click when collapsed
      navigate(to);
    }, [isOpen, navigate, to]);

    const isStreaming = useChatStore((s) => s.isStreamingFor(String(conversation.id)));
    const unread = useChatStore((s) => Boolean(s.unread[String(conversation.id)]));
    const markRead = useChatStore((s) => s.markConversationRead);

    const content = (
      <Link
        to={isOpen ? to : "#"}
        tabIndex={isOpen ? 0 : -1}
        className={cn(
          "group flex items-center justify-between gap-2 pl-3 pr-3 py-2 h-9 rounded-md text-sm font-normal relative overflow-hidden",
          "hover:bg-sidebar-hover",
          isActive && "bg-sidebar-hover/75 font-medium"
        )}
        onClick={() => markRead(String(conversation.id))}
      >
        {/* title */}
        <span className="truncate text-foreground flex items-center gap-2">
          {conversation.title}
          {isStreaming && <span className="size-2 rounded-full bg-primary animate-pulse" />}
          {unread && !isActive && <span className="size-2 rounded-full bg-blue-400" />}
        </span>

        {/* options */}
        <div
          className={cn(
            "flex items-center self-stretch text-muted-foreground opacity-0 group-hover:opacity-100",
            !isOpen && "pointer-events-none opacity-0"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-transparent"
                aria-label="Open conversation options"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <IconDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32">
            <DropdownMenuItem
                onClick={() => {}}
              >
                <IconPencil className="size-5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {}}
              >
                <IconArchive className="size-5" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="text-destructive size-5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Link>
    );

    /* preserve the previous “click-anywhere” UX */
    return <div onClick={handleRowClick}>{content}</div>;
  },
  (a, b) =>
    a.conversation.id === b.conversation.id &&
    a.conversation.title === b.conversation.title &&
    a.isOpen === b.isOpen &&
    a.isActive === b.isActive
);
