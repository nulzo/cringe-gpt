import {IconPencil} from "@tabler/icons-react";
import {Link} from "react-router-dom";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";

export function ImageGenerationLink({isOpen}: { isOpen: boolean }) {
    const commonClasses = `flex items-center w-full h-9 rounded text-sm font-base text-muted-foreground transition-colors group relative overflow-hidden`;

    const element = (
        <Link to="/image-generation" className={commonClasses}>
            <div
                className={`absolute left-0 top-0 h-full rounded-md group-hover:bg-sidebar-hover transition-all ease-in-out`}
                style={{
                    left: isOpen ? "0px" : "8px",
                    width: isOpen ? "100%" : "40px",
                }}
            ></div>
            <div
                className={`w-[56px] h-full flex-shrink-0 flex items-center justify-center z-10 text-muted-foreground group-hover:text-foreground`}
            >
                <IconPencil size={18}/>
            </div>
            <div
                className={`flex-1 flex items-center justify-between whitespace-nowrap overflow-hidden z-10 ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"} transition-all ease-in-out`}
            >
                <span className={`group-hover:text-foreground`}>
                    Image Generation
                </span>
            </div>
        </Link>
    );

    return (
        <Tooltip disableHoverableContent={isOpen}>
            <TooltipTrigger asChild>{element}</TooltipTrigger>
            {!isOpen && (
                <TooltipContent side="right" sideOffset={4}>
                    <p>Image Generation</p>
                </TooltipContent>
            )}
        </Tooltip>
    );
} 