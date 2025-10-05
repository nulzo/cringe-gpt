import * as React from "react"
import {Skeleton} from "@/components/ui/skeleton"
import {cn} from "@/lib/utils"

export function SidebarMenuSkeleton({
                                        className,
                                        showIcon = false,
                                        ...props
                                    }: React.ComponentProps<"div"> & {
    showIcon?: boolean
}) {
    return (
        <div
            className={cn("flex items-center gap-2 p-2", className)}
            data-slot="sidebar-menu-skeleton"
            {...props}
        >
            {showIcon && <Skeleton className="size-4"/>}
            <Skeleton className="h-4 flex-1"/>
        </div>
    )
} 