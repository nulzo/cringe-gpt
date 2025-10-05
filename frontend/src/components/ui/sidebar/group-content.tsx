import * as React from "react"
import {cn} from "@/lib/utils"

export function SidebarGroupContent({
                                        className,
                                        ...props
                                    }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-group-content"
            className={cn(
                "group-data-[state=expanded]/sidebar-container:space-y-1",
                className
            )}
            {...props}
        />
    )
} 