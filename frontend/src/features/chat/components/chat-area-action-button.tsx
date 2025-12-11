import {Tooltip, TooltipContent, TooltipTrigger,} from "@/components/ui/tooltip";
import {type Icon, type IconProps} from "@tabler/icons-react";
import type {ComponentPropsWithRef, ElementType, ForwardRefExoticComponent, RefAttributes,} from "react";
import {cn} from "@/lib/utils";

type PolymorphicComponentProps<T extends ElementType> = {
    as?: T;
    tooltipText: string;
    icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    disabled?: boolean;
} & Omit<ComponentPropsWithRef<T>, "as">;

export const ChatAreaActionButton = <T extends ElementType = "button">({
                                                                           as,
                                                                           tooltipText,
                                                                           icon: Icon,
                                                                           disabled = false,
                                                                           className,
                                                                           ...props
                                                                       }: PolymorphicComponentProps<T>) => {
    const Component = as || "button";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Component
                    className={cn(
                        "h-9 w-9 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        disabled
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer hover:bg-hover hover:text-accent-foreground",
                        className
                    )}
                    disabled={disabled}
                    {...props}
                >
                    <Icon className="size-4 stroke-1"/>
                </Component>
            </TooltipTrigger>
            <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
    );
};
