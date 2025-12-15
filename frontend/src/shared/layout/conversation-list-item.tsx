import type { Conversation } from "@/features/chat/types";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChatStore } from "@/features/chat/stores/chat-store";
import {
  memo,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  IconArchive,
  IconArchiveOff,
  IconDots,
  IconPencil,
  IconTag,
  IconTrash,
} from "@tabler/icons-react";
import { useUpdateConversation } from "@/features/chat/api/update-conversation";
import { useDeleteConversation } from "@/features/chat/api/delete-conversation";
import { useTags } from "@/features/chat/api/get-tags";

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
    const location = useLocation();
    const to = `/chat/${conversation.id}`;

    const isHidden = conversation.isHidden ?? conversation.is_hidden ?? false;
    const tags = conversation.tags ?? [];

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [draftTitle, setDraftTitle] = useState(conversation.title);
    const initialTags = useMemo(
      () => (conversation.tags ?? []).map((t) => t.name),
      [conversation.tags],
    );
    const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
    const [tagInput, setTagInput] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const updateConversation = useUpdateConversation();
    const deleteConversation = useDeleteConversation();
    const availableTags = useTags();

    useEffect(() => {
      setDraftTitle(conversation.title);
      setSelectedTags(initialTags);
    }, [conversation.title, initialTags]);

    const toggleTag = (name: string) => {
      setSelectedTags((prev) => {
        const lowerName = name.toLowerCase();
        const exists = prev.some((t) => t.toLowerCase() === lowerName);
        if (exists) {
          return prev.filter((t) => t.toLowerCase() !== lowerName);
        } else {
          return [...prev, name];
        }
      });
    };

    const addTag = (name: string) => {
      const value = name.trim();
      if (!value) return;
      setSelectedTags((prev) => {
        const exists = prev.some(
          (t) => t.toLowerCase() === value.toLowerCase(),
        );
        return exists ? prev : [...prev, value];
      });
      setTagInput("");
    };

    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag(tagInput);
      }
    };

    const handleSave = async () => {
      await updateConversation.mutateAsync({
        id: conversation.id,
        title: draftTitle.trim() || conversation.title,
        tags: selectedTags,
      });
      setIsEditOpen(false);
    };

    const handleArchiveToggle = async () => {
      await updateConversation.mutateAsync({
        id: conversation.id,
        isHidden: !isHidden,
      });
      if (!isHidden && location.pathname === to) {
        navigate("/");
      }
    };

    const handleDelete = async () => {
      await deleteConversation.mutateAsync(conversation.id);
      setIsDeleteOpen(false);
      if (location.pathname === to) {
        navigate("/");
      }
    };

    const isStreaming = useChatStore((s) =>
      s.isStreamingFor(String(conversation.id)),
    );
    const unread = useChatStore((s) =>
      Boolean(s.unread[String(conversation.id)]),
    );
    const markRead = useChatStore((s) => s.markConversationRead);

    const content = (
      <div
        className={cn(
          "group flex items-center gap-2 pl-3 pr-3 py-2 h-9 rounded-md text-sm font-normal relative overflow-hidden",
          "hover:bg-sidebar-hover",
          (isActive || isDropdownOpen) && "bg-sidebar-hover/75 font-medium",
        )}
      >
        <Link
          to={to}
          className="flex min-w-0 flex-1 items-center gap-2 h-full cursor-pointer z-10"
          onClick={() => {
            markRead(String(conversation.id));
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-foreground">
              {conversation.title}
            </span>
            {isStreaming && (
              <span className="size-2 shrink-0 rounded-full bg-primary animate-pulse" />
            )}
            {unread && !isActive && (
              <span className="size-2 shrink-0 rounded-full bg-blue-400" />
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {tags.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <IconTag className="size-3" />
                {tags.length}
              </span>
            )}
            {isHidden && (
              <span className="text-[10px] whitespace-nowrap rounded-full bg-muted px-2 py-[2px] text-muted-foreground">
                Archived
              </span>
            )}
          </div>
        </Link>

        {/* options */}
        <div
          className={cn(
            "flex items-center self-stretch text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 z-20",
            !isOpen && "pointer-events-none opacity-0",
            isDropdownOpen && "opacity-100",
          )}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-transparent hover:text-foreground"
                aria-label="Open conversation options"
              >
                <IconDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsEditOpen(true);
                }}
              >
                <IconPencil className="size-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleArchiveToggle();
                }}
              >
                {isHidden ? (
                  <IconArchiveOff className="size-4 mr-2" />
                ) : (
                  <IconArchive className="size-4 mr-2" />
                )}
                {isHidden ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDeleteOpen(true);
                }}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="text-destructive size-4 mr-2" />
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );

    return (
      <>
        {content}

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Rename chat</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground ml-1">
                  Name
                </label>
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Chat name"
                  className="bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:border-primary/50"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground ml-1">
                    Tags
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Select to apply
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Render available tags as toggleable chips */}
                  {availableTags.data?.map((tag) => {
                    const isSelected = selectedTags.some(
                      (t) => t.toLowerCase() === tag.name.toLowerCase(),
                    );
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                          isSelected
                            ? "bg-foreground text-background border-foreground hover:bg-foreground/90"
                            : "bg-background text-foreground border-border hover:bg-muted",
                        )}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add new tag..."
                    className="bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:border-primary/50 text-xs h-9"
                  />
                  {tagInput && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => addTag(tagInput)}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateConversation.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete chat?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete{" "}
                <span className="font-medium text-foreground">
                  "{conversation.title}"
                </span>
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  },
  (a, b) =>
    a.conversation.id === b.conversation.id &&
    a.conversation.title === b.conversation.title &&
    a.isOpen === b.isOpen &&
    a.isActive === b.isActive,
);
