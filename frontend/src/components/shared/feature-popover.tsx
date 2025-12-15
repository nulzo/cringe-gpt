import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ElementType, ReactNode } from "react";
import { ChatAreaActionButton } from "./action-button";
import { cn } from "@/lib/utils";

interface ChatFeaturePopoverProps {
  icon: ElementType;
  tooltip?: string;
  children: ReactNode;
  isIndicatorActive?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  disabled?: boolean;
}

export function ChatFeaturePopover({
  icon,
  tooltip,
  children,
  isIndicatorActive,
  open,
  onOpenChange,
  className,
  contentClassName,
  side = "top",
  align = "start",
  disabled,
}: ChatFeaturePopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <ChatAreaActionButton
          icon={icon}
          tooltipText={tooltip || ""}
          disabled={disabled}
          className={cn("relative", className)}
        >
          {isIndicatorActive && (
            <span
              aria-hidden
              className="absolute top-0 right-0 size-2 rounded-full bg-primary shadow-[0_0_0_2px_var(--popover-background,_#111)] animate-in fade-in zoom-in duration-300"
            />
          )}
        </ChatAreaActionButton>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0 shadow-lg border-border/60 bg-popover",
          contentClassName,
        )}
        side={side}
        align={align}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
