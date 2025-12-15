import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      data-slot="sidebar-group-label"
      className={cn(
        "text-muted-foreground group-data-[state=collapsed]/sidebar-container:hidden flex items-center justify-between px-2 py-1 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}
