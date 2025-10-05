import { useConversations } from "@/features/chat/api/get-conversations";
import { useLocation } from "react-router-dom";
import { SidebarConversationItem } from "./conversation-list-item";
import { useMemo } from "react";
import type { Conversation } from "@/features/chat/types";
import { useVirtualizer } from "@tanstack/react-virtual";

interface ConversationListProps {
  isOpen: boolean;
  parentRef: React.RefObject<HTMLDivElement>;
}

export function ConversationList({ isOpen, parentRef }: ConversationListProps) {
  const { data: conversations, isLoading } = useConversations();
  const location = useLocation();
  // Hooks must be called consistently across renders; compute groups before any early return
  const groups = useMemo(() => {
    const buckets: Record<string, Conversation[]> = {
      Today: [],
      "Last 7 days": [],
      "Last 30 days": [],
      Earlier: [],
    };

    const now = Date.now();
    (Array.isArray(conversations) ? conversations : []).forEach((c) => {
      const updatedAt = (c as any)?.updatedAt as string | undefined;
      const createdAt = (c as any)?.createdAt as string | undefined;
      const ts = new Date(updatedAt ?? createdAt ?? Date.now()).getTime();
      const diff = now - ts;
      const oneDay = 24 * 60 * 60 * 1000;
      const sevenDays = 7 * oneDay;
      const thirtyDays = 30 * oneDay;
      if (diff < oneDay) buckets["Today"].push(c);
      else if (diff < sevenDays) buckets["Last 7 days"].push(c);
      else if (diff < thirtyDays) buckets["Last 30 days"].push(c);
      else buckets["Earlier"].push(c);
    });
    // Only keep non-empty buckets
    const ordered: Array<{
      type: "header" | "item";
      label?: string;
      item?: Conversation;
    }> = [];
    (Object.entries(buckets) as Array<[string, Conversation[]]>).forEach(
      ([label, items]) => {
        if (items.length === 0) return;
        ordered.push({ type: "header", label });
        items.forEach((item) => ordered.push({ type: "item", item }));
      }
    );
    return { buckets, ordered };
  }, [conversations]);

  // Virtualized flat list of headers + items
  const rowVirtualizer = useVirtualizer({
    count: groups.ordered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) =>
      groups.ordered[index].type === "header" ? 28 : 36,
    overscan: 20,
  });

  const items = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div className="relative" style={{ height: `${totalSize || 1}px` }}>
      {isLoading && (
        <div className="p-4 text-sm text-muted-foreground">Loading...</div>
      )}
      {items.map((virtualRow) => {
        const row = groups.ordered[virtualRow.index];
        if (row.type === "header") {
          return (
            <div
              key={`h-${virtualRow.index}`}
              className="absolute left-0 right-0 px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground select-none"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {row.label}
            </div>
          );
        }
        const c = row.item as Conversation;
        return (
          <div
            key={`i-${c.id}-${virtualRow.index}`}
            className="absolute left-0 right-0"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            <SidebarConversationItem
              conversation={c}
              isOpen={isOpen}
              isActive={location.pathname === `/chat/${c.id}`}
            />
          </div>
        );
      })}
    </div>
  );
}
