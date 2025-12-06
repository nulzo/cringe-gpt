import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SidebarConversationItem } from "@/shared/layout/conversation-list-item";
import type { Conversation } from "@/features/chat/types";
import { cn } from "@/lib/utils";

interface Props {
  conversations: Conversation[];
  isLoading: boolean;
  isSidebarOpen: boolean;
}

export function SidebarConversationList({ conversations, isLoading, isSidebarOpen }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => conversations ?? [], [conversations]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 8,
  });

  return (
    <div
      className="overflow-auto"
      style={{
        height: "calc(100% - 80px)",
        maxHeight: "calc(100% - 80px)",
      }}
    >
      <nav className={cn("p-2", !isSidebarOpen && "pointer-events-none")}>
        <div className="mb-2">
          <div
            className={cn(
              "px-3 h-8 flex items-center justify-between",
              isSidebarOpen ? "opacity-100" : "hidden"
            )}
          >
            <div className="overflow-hidden text-[12px] text-muted-foreground/75 whitespace-nowrap select-none">
              Conversations
            </div>
          </div>

          <div
            ref={parentRef}
            className="relative"
            style={{
              height: parentRef.current ? `${virtualizer.getTotalSize()}px` : "100%",
            }}
          >
            {isLoading && <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>}
            {!isLoading &&
              virtualizer.getVirtualItems().map((virtualRow) => {
                const convo = items[virtualRow.index];
                const isActive = window.location.pathname === `/chat/${convo.id}`;
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <SidebarConversationItem
                      conversation={convo}
                      isOpen={isSidebarOpen}
                      isActive={isActive}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </nav>
    </div>
  );
}

