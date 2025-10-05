import {memo} from "react";
import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,} from "@/components/ui/tooltip";
import {useClipboard} from "@/hooks/use-clipboard";
import {MessageDetails} from "./message-details";
import type {Message} from "../types";
import {
    IconCheck,
    IconCopy,
    IconHeart,
    IconRefresh,
    IconThumbDown,
    IconThumbUp,
    IconVolume,
} from "@tabler/icons-react";

interface MessageActionsProps {
    message: Message;
    isLiked: boolean;
    handleLike: () => void;
}

export const MessageActions = memo(
    ({
         message,
         isLiked,
         handleLike,
     }: MessageActionsProps) => {
        const {copy, copied} = useClipboard();

        return (
            <div className="flex items-center gap-2">
                <div className="flex mt-0 rounded-lg w-fit">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleLike}
                                    className="size-9 text-muted-foreground hover:text-foreground "
                                >
                                    {isLiked ? (
                                        <IconHeart
                                            className="size-5 fill-current text-red-500"
                                            strokeWidth={2}
                                        />
                                    ) : (
                                        <IconHeart className="size-5" strokeWidth={2}/>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isLiked ? "Unlike message" : "Like message"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copy(message.content)}
                                    className="size-9 text-muted-foreground hover:text-foreground "
                                >
                                    {copied ? <IconCheck className="size-5" strokeWidth={2} /> : <IconCopy className="size-5" strokeWidth={2}/>}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy message</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copy(message.content)}
                                    className="size-9 text-muted-foreground hover:text-foreground "
                                >
                                    <IconThumbUp className="size-5" strokeWidth={2}/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy message</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copy(message.content)}
                                    className="size-9 text-muted-foreground hover:text-foreground "
                                >
                                    <IconThumbDown className="size-5" strokeWidth={2}/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy message</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copy(message.content)}
                                    className="size-9 text-muted-foreground hover:text-foreground "
                                >
                                    <IconVolume className="size-5" strokeWidth={2}/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy message</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copy(message.content)}
                                    className="size-9 text-muted-foreground hover:text-foreground "
                                >
                                    <IconRefresh className="size-5" strokeWidth={2}/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy message</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <MessageDetails message={message}/>
                </div>
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Only re-render if essential props changed
        return (
            prevProps.isLiked === nextProps.isLiked &&
            prevProps.message.id === nextProps.message.id
        );
    }
);
