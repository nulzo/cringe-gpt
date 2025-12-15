import * as React from "react";
import { cn } from "@/lib/utils";

export function SidebarInset({
  className,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background text-foreground transition-all peer-data-[variant=inset]:ml-[var(--sidebar-width)]",
        "peer-data-[side=right]:peer-data-[variant=inset]:mr-[var(--sidebar-width)]",
        "peer-data-[side=right]:peer-data-[variant=inset]:ml-0",
        "peer-data-[collapsible=icon]:peer-data-[variant=inset]:ml-[calc(var(--sidebar-width-icon)+var(--spacing-4))]",
        "peer-data-[side=right]:peer-data-[collapsible=icon]:peer-data-[variant=inset]:mr-[calc(var(--sidebar-width-icon)+var(--spacing-4))]",
        className,
      )}
      {...props}
    />
  );
}
