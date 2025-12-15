import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClipboard } from "@/hooks/use-clipboard";
import { MessageDetails } from "./message-details";
import type { Message } from "../types";
import {
  Copy01Icon,
  FavouriteIcon,
  Refresh01Icon,
  Tick02Icon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";

interface MessageActionsProps {
  message: Message;
  isLiked: boolean;
  handleLike: () => void;
}

export const MessageActions = memo(
  ({ message, isLiked, handleLike }: MessageActionsProps) => {
    const { copy, copied } = useClipboard();

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
                    <Icon icon={FavouriteIcon} size="icon" />
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
                  {copied ? (
                    <Icon icon={Tick02Icon} size="icon" />
                  ) : (
                    <Icon icon={Copy01Icon} size="icon" />
                  )}
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
                  <Icon icon={VolumeHighIcon} size="icon" />
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
                  <Icon icon={Refresh01Icon} size="icon" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <MessageDetails message={message} />
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
  },
);
