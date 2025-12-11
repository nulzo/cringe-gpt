import type { Conversation } from "@/features/chat/types";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChatStore } from '@/features/chat/stores/chat-store';
import { memo, useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";

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
  DialogDescription,
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
import { IconArchive, IconArchiveOff, IconDots, IconPencil, IconTag, IconTrash, IconX } from "@tabler/icons-react";
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
    const initialTags = useMemo(() => (conversation.tags ?? []).map((t) => t.name), [conversation.tags]);
    const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
    const [tagInput, setTagInput] = useState('');

    const updateConversation = useUpdateConversation();
    const deleteConversation = useDeleteConversation();
    const availableTags = useTags();

    useEffect(() => {
      setDraftTitle(conversation.title);
      setSelectedTags(initialTags);
    }, [conversation.title, initialTags]);

    const addTag = (name: string) => {
      const value = name.trim();
      if (!value) return;
      setSelectedTags((prev) => {
        const exists = prev.some((t) => t.toLowerCase() === value.toLowerCase());
        return exists ? prev : [...prev, value];
      });
      setTagInput('');
    };

    const removeTag = (name: string) => {
      setSelectedTags((prev) => prev.filter((t) => t.toLowerCase() !== name.toLowerCase()));
    };

    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(tagInput);
      } else if (e.key === 'Backspace' && !tagInput && selectedTags.length) {
        removeTag(selectedTags[selectedTags.length - 1]);
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
        navigate('/');
      }
    };

    const handleDelete = async () => {
      await deleteConversation.mutateAsync(conversation.id);
      setIsDeleteOpen(false);
      if (location.pathname === to) {
        navigate('/');
      }
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
          "group flex items-center gap-2 pl-3 pr-3 py-2 min-h-[44px] rounded-md text-sm font-normal relative overflow-hidden",
          "hover:bg-sidebar-hover",
          isActive && "bg-sidebar-hover/75 font-medium"
        )}
        onClick={() => markRead(String(conversation.id))}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-foreground">{conversation.title}</span>
          {isStreaming && <span className="size-2 flex-shrink-0 rounded-full bg-primary animate-pulse" />}
          {unread && !isActive && <span className="size-2 flex-shrink-0 rounded-full bg-blue-400" />}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
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

        {/* options */}
        <div
          className={cn(
            "flex items-center self-stretch text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0",
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
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsEditOpen(true);
                }}
              >
                <IconPencil className="size-5" />
                Rename & tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleArchiveToggle();
                }}
              >
                {isHidden ? <IconArchiveOff className="size-5" /> : <IconArchive className="size-5" />}
                {isHidden ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDeleteOpen(true);
                }}
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
    return (
      <div onClick={handleRowClick}>
        {content}

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit conversation</DialogTitle>
              <DialogDescription>
                Rename this chat and manage its tags for faster filtering.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Conversation title"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Tags</label>
                  {availableTags.data && availableTags.data.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      Suggestions:
                      <span className="ml-2 flex gap-1 flex-wrap">
                        {availableTags.data.slice(0, 6).map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => addTag(tag.name)}
                            className="rounded-full border border-border px-2 py-[2px] text-[11px] hover:bg-muted transition-colors"
                          >
                            {tag.name}
                          </button>
                        ))}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedTags.length === 0 && (
                    <span className="text-xs text-muted-foreground">No tags yet</span>
                  )}
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-[4px] text-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <IconX className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button type="button" variant="secondary" onClick={() => addTag(tagInput)}>
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateConversation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the chat and its messages permanently.
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
      </div>
    );
  },
  (a, b) =>
    a.conversation.id === b.conversation.id &&
    a.conversation.title === b.conversation.title &&
    a.isOpen === b.isOpen &&
    a.isActive === b.isActive
);
