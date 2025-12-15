import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type ComponentProps, type ElementType } from "react";
import { cn } from "@/lib/utils";

type PolymorphicComponentProps<T extends ElementType> = {
  as?: T;
  tooltipText: string;
  icon?: ElementType;
  disabled?: boolean;
} & Omit<ComponentProps<T>, "as" | "icon">;

export const ChatAreaActionButton = <T extends ElementType = "button">({
  as,
  tooltipText,
  icon: Icon,
  disabled = false,
  className,
  children,
  ref,
  ...props
}: PolymorphicComponentProps<T>) => {
  const Component = as || "button";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Component
          ref={ref}
          className={cn(
            "h-9 w-9 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled
              ? "pointer-events-none opacity-50"
              : "cursor-pointer hover:bg-hover hover:text-accent-foreground",
            className,
          )}
          disabled={disabled}
          {...props}
        >
          {Icon && <Icon className="size-5" />}
          {children}
        </Component>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
};

ChatAreaActionButton.displayName = "ChatAreaActionButton";
