import * as React from "react"
import {cn} from "@/lib/utils"

export function SidebarContent({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-content"
            className={cn(
                "h-full overflow-y-auto overflow-x-hidden p-2",
                className
            )}
            {...props}
        />
    )
} 