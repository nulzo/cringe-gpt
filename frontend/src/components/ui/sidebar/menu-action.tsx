import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="sidebar-menu-action"
      className={cn(
        "text-muted-foreground group-data-[state=collapsed]/sidebar-container:hidden",
        "hover:text-foreground disabled:text-muted-foreground/50 size-4 disabled:cursor-not-allowed",
        "absolute right-2 top-1/2 -translate-y-1/2",
        showOnHover && "opacity-0 group-hover/sidebar-menu-item:opacity-100",
        className,
      )}
      {...props}
    />
  );
}
