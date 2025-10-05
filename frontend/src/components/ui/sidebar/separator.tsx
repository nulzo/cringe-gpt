import * as React from "react"
import {Separator} from "@/components/ui/separator"
import {cn} from "@/lib/utils"

export function SidebarSeparator({
                                     className,
                                     ...props
                                 }: React.ComponentProps<typeof Separator>) {
    return (
        <Separator
            className={cn("my-2", "group-data-[state=collapsed]/sidebar-container:mx-2", className)}
            {...props}
        />
    )
} 