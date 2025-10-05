import * as React from "react"
import {useSidebar} from "./provider"
import {cn} from "@/lib/utils"

export function SidebarRail({className, ...props}: React.ComponentProps<"button">) {
    const {toggleSidebar, state} = useSidebar()
    return (
        <button
            data-slot="sidebar-rail"
            onClick={toggleSidebar}
            className={cn(
                "bg-background text-foreground group absolute -right-3 top-1/2 z-10 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-all",
                "group-data-[side=right]/sidebar-wrapper:rotate-180",
                "group-data-[variant=floating]/sidebar:top-4 group-data-[variant=floating]/sidebar:translate-y-0",
                "group-data-[collapsible=offcanvas]/sidebar:hidden",
                "group-data-[state=expanded]/sidebar-container:group-data-[collapsible=icon]/sidebar:hidden",
                className
            )}
            {...props}
        >
            <div
                className="size-2.5 rounded-sm bg-gray-400 transition-transform group-hover:bg-gray-500 group-data-[state=expanded]/sidebar-container:rotate-90"/>
        </button>
    )
} 