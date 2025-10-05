import * as React from "react"
import {cn} from "@/lib/utils"

export function SidebarMenu({className, ...props}: React.ComponentProps<"ul">) {
    return (
        <ul
            data-slot="sidebar-menu"
            className={cn("space-y-1", className)}
            {...props}
        />
    )
} 