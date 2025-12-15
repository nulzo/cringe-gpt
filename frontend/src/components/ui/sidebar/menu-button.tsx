import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useSidebar } from "./provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const sidebarMenuButtonVariants = cva(
  "group/sidebar-menu-button flex w-full items-center justify-start gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium outline-none transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "hover:bg-accent hover:text-accent-foregroundaria-selected:bg-accent aria-selected:text-accent-foreground",
        secondary:
          "hover:bg-muted/50 hover:text-foreground/80 aria-selected:bg-muted/50 aria-selected:text-foreground/80",
      },
      size: {
        default: "h-8",
        sm: "h-7",
        lg: "h-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { state } = useSidebar();
  const Comp = asChild ? Slot : "button";
  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      aria-selected={isActive}
      className={cn(
        sidebarMenuButtonVariants({ variant, size }),
        "group-data-[state=collapsed]/sidebar-container:h-8 group-data-[state=collapsed]/sidebar-container:w-8 group-data-[state=collapsed]/sidebar-container:justify-center group-data-[state=collapsed]/sidebar-container:px-0",
        className,
      )}
      {...props}
    />
  );

  if (state === "collapsed" && tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          {...(typeof tooltip === "object" && tooltip)}
        >
          {typeof tooltip === "string" ? tooltip : tooltip.children}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
