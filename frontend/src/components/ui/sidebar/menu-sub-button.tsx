import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      aria-selected={isActive}
      className={cn(
        "flex w-full items-center justify-start gap-2 rounded-md px-2 text-left text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "aria-selected:bg-accent aria-selected:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "md" ? "h-8 py-1.5" : "h-7 py-1",
        className,
      )}
      {...props}
    />
  );
}
