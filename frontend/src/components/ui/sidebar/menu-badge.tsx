import * as React from "react"
import {cn} from "@/lib/utils"

export function SidebarMenuBadge({
                                     className,
                                     ...props
                                 }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-menu-badge"
            className={cn(
                "group-data-[state=collapsed]/sidebar-container:absolute group-data-[state=collapsed]/sidebar-container:right-0 group-data-[state=collapsed]/sidebar-container:top-0 group-data-[state=collapsed]/sidebar-container:-translate-y-1/2 group-data-[state=collapsed]/sidebar-container:translate-x-1/2 group-data-[state=collapsed]/sidebar-container:rounded-full group-data-[state=collapsed]/sidebar-container:border-2 group-data-[state=collapsed]/sidebar-container:border-background",
                "group-data-[state=expanded]/sidebar-container:ml-auto",
                className
            )}
            {...props}
        />
    )
} 