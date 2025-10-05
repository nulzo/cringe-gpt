import * as React from "react"
import {cn} from "@/lib/utils"

export function SidebarGroup({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-group"
            className={cn("group/sidebar-group", className)}
            {...props}
        />
    )
} 