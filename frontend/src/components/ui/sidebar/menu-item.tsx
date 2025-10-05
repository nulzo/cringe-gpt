import * as React from "react"
import {cn} from "@/lib/utils"
import {useSidebar} from "./provider"

export function SidebarMenuItem({className, ...props}: React.ComponentProps<"li">) {
    const {state} = useSidebar()
    return (
        <li
            data-slot="sidebar-menu-item"
            className={cn(
                "group/sidebar-menu-item relative",
                state === "collapsed" && "[&>[data-slot=sidebar-menu-badge]]:hidden",
                state === "collapsed" && "[&>[data-slot=sidebar-menu-sub]]:hidden",
                className
            )}
            {...props}
        />
    )
} 