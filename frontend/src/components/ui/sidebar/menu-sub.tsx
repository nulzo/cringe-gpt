import * as React from "react";
import { cn } from "@/lib/utils";

export function SidebarMenuSub({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      className={cn(
        "bg-background/20 ml-6 mt-1 space-y-1 rounded-md border py-1 pr-2",
        className,
      )}
      {...props}
    />
  );
}
