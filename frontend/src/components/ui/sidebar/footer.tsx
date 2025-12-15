import * as React from "react";
import { cn } from "@/lib/utils";

export function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-auto border-t p-2", className)}
      {...props}
    />
  );
}
