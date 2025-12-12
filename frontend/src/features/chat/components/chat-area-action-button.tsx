import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Icon, type IconProps } from "@tabler/icons-react";
import {
  type ComponentPropsWithRef,
  type ElementType,
  type ForwardRefExoticComponent,
  type RefAttributes,
  forwardRef,
} from "react";
import { cn } from "@/lib/utils";

type PolymorphicComponentProps<T extends ElementType> = {
  as?: T;
  tooltipText: string;
  icon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
  disabled?: boolean;
} & Omit<ComponentPropsWithRef<T>, "as" | "icon">;

export const ChatAreaActionButton = forwardRef(
  <T extends ElementType = "button">(
    {
      as,
      tooltipText,
      icon: Icon,
      disabled = false,
      className,
      children,
      ...props
    }: PolymorphicComponentProps<T>,
    ref: any
  ) => {
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
              className
            )}
            disabled={disabled}
            {...props}
          >
            {Icon && <Icon className="size-4 stroke-1" />}
            {children}
          </Component>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    );
  }
);

ChatAreaActionButton.displayName = "ChatAreaActionButton";
