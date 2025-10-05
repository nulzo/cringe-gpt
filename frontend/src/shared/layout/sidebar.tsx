import { useUIState } from "@/shared/layout/ui-state-provider";
import { cn } from "@/lib/utils";
import { ConversationList } from "./conversation-list";
import { SidebarNav } from "./sidebar-nav";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarHeader } from "./sidebar-header";
import { useRef } from "react";

export function Sidebar() {
  const { isSidebarOpen: isOpen, openSidebar, closeSidebar } = useUIState();
  const scrollParentRef = useRef<HTMLDivElement>(null!);

  return (
    <aside
      className={cn(
        "h-full flex flex-col flex-shrink-0 bg-sidebar border-r border-sidebar-border/80 transition-[width] duration-200 ease-out will-change-[width]",
        isOpen ? "w-[260px]" : "w-[72px]"
      )}
    >
      <SidebarHeader
        isOpen={isOpen}
        onOpen={openSidebar}
        onClose={closeSidebar}
      />
      <SidebarNav isOpen={isOpen} />
      <div className="mx-2 h-px bg-border" />

      {/* Main scrollable area */}
      <div
        ref={scrollParentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-2"
      >
        <div
          className={`text-[12px] m-2 text-muted-foreground/75 whitespace-nowrap overflow-hidden select-none ${
            isOpen ? "opacity-100" : "hidden"
          }`}
          style={{
            transitionDuration: `300ms`,
            transitionDelay: isOpen ? "200ms" : "0ms",
          }}
        >
          Conversations
        </div>
        <ConversationList isOpen={isOpen} parentRef={scrollParentRef} />
      </div>

      <div className="flex-shrink-0 sticky bottom-0 bg-sidebar z-10">
        <div className="h-px mx-2 bg-border" />
        <SidebarFooter isOpen={isOpen} />
      </div>
    </aside>
  );
}
