import {formatDetailedDate} from "@/utils/format";
import type {Message} from "../types";

interface MessageHeaderProps {
    message: Message;
    isModelOnline: boolean;
    providerName?: string;
}

export const MessageHeader = ({
                                  message,
                                  isModelOnline,
                                  providerName,
                              }: MessageHeaderProps) => {
    const formattedDate = formatDetailedDate(
        new Date(message.created_at || message.createdAt!).getTime()
    );

    if (message.role === "user") {
        return (
            <div className="flex items-baseline align-text-bottom mr-3">
        <span className="text-[10px] text-muted-foreground">
          {formattedDate}
        </span>
            </div>
        );
    }

    return (
        <div className="flex items-end gap-2">
            <div className="flex items-end gap-1.5 ml-1">
        <span className="font-medium text-muted-foreground text-sm leading-none flex flex-col gap-1">
          {message.name || message.model || providerName || "Assistant"}
            <span className="text-[10px] text-muted-foreground/70 leading-none">
            {formattedDate}
          </span>
        </span>
            </div>
        </div>
    );
};
