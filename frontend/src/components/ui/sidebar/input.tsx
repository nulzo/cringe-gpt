import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="p-2">
      <Input
        className={cn("h-8 rounded-sm", className)}
        placeholder="Search..."
        {...props}
      />
    </div>
  );
}
