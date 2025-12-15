import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="sidebar-group-action"
      className={cn(
        "text-muted-foreground group-data-[state=collapsed]/sidebar-container:hidden",
        "hover:text-foreground disabled:text-muted-foreground/50 size-5 disabled:cursor-not-allowed",
        "flex items-center justify-center",
        className,
      )}
      {...props}
    />
  );
}
