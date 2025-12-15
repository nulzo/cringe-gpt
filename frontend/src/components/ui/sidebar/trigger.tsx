import * as React from "react";
import { PanelLeftIcon } from "lucide-react";
import { useSidebar } from "./provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-8", className)}
      onClick={(e) => {
        toggleSidebar();
        onClick?.(e);
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}
