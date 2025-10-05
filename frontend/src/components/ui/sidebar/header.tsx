import * as React from "react";
import {cn} from "@/lib/utils";

export function SidebarHeader({
                                  className,
                                  ...props
                              }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-header"
            className={cn("border-b p-2", className)}
            {...props}
        />
    );
}
