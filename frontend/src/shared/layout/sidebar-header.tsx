import { IconLayoutSidebar, IconMenu2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { CringeLogo } from "@/components/cringe";
import { APP_NAME, APP_VERSION } from "@/configuration/const";
import { cn } from "@/lib/utils";
import { NewCringeLogo } from "@/components/cringe-new";

interface SidebarHeaderProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function SidebarHeader({ isOpen, onOpen, onClose }: SidebarHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-sidebar flex-shrink-0">
      <div className="flex h-14 sm:h-16 items-center px-2 gap-1">
        <div className="w-12 h-12 flex items-center justify-center">
          {isOpen ? (
            <CringeLogo className="size-5 ml-3" />
          ) : (
            <Button
              onClick={onOpen}
              variant="ghost"
              className="text-foreground ml-1"
            >
              <IconMenu2 size={24} />
            </Button>
          )}
        </div>

        <div
          className={cn(
            "flex items-center justify-between flex-1 overflow-hidden transition-all",
            isOpen
              ? "opacity-100 ml-2 translate-x-0"
              : "opacity-0 ml-0 -translate-x-2 pointer-events-none"
          )}
        >
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">
              {APP_NAME}
            </span>
            <span className="text-xs text-primary">{APP_VERSION}</span>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-foreground mr-1"
          >
            <IconLayoutSidebar size={24} />
          </Button>
        </div>
      </div>
      <div className="mx-2 h-px bg-border" />
    </div>
  );
}
