import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCost, formatDate, formatNumber } from "@/utils/format";
import type { Message } from "../types";
import {
  IconInfoCircle,
  IconHeart,
  IconClock,
  IconCoins,
  IconMessage,
  IconTool,
  IconImageInPicture,
  IconFile,
} from "@tabler/icons-react";
import { useMessageDetails } from "../api/get-message-details";
import { Icon } from "@/components/ui/icon";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

// Combined type for message data that can come from either the API or the message object
type MessageData = {
  created_at?: string;
  createdAt?: string;
  provider?: string;
  model?: string;
  tokenCount?: number;
  tokens_used?: number;
  generationTime?: number;
  generation_time?: number;
  totalCost?: number;
  total_cost?: number;
  finishReason?: string;
  finish_reason?: string;
  isLiked?: boolean;
  is_liked?: boolean;
  isHidden?: boolean;
  is_hidden?: boolean;
  isError?: boolean;
  is_error?: boolean;
  hasImages?: boolean;
  has_images?: boolean;
  hasCitations?: boolean;
  has_citations?: boolean;
  hasToolCalls?: boolean;
  has_tool_calls?: boolean;
  attachmentCount?: number;
  messageId?: string;
  message_id?: string;
};

interface MessageDetailsProps {
  message: Message;
  isLoading?: boolean;
}

// Helper functions to get the correct property values
const getCreatedAt = (data: MessageData): string | undefined => {
  return data.createdAt || data.created_at;
};

const getProvider = (data: MessageData): string | undefined => {
  return data.provider;
};

const getModel = (data: MessageData): string | undefined => {
  return data.model;
};

const getTokenCount = (data: MessageData): number | undefined => {
  return data.tokenCount || data.tokens_used;
};

const getGenerationTime = (data: MessageData): number | undefined => {
  return data.generationTime || data.generation_time;
};

const getTotalCost = (data: MessageData): number | undefined => {
  return data.totalCost || data.total_cost;
};

const getFinishReason = (data: MessageData): string | undefined => {
  return data.finishReason || data.finish_reason;
};

const getIsLiked = (data: MessageData): boolean => {
  return data.isLiked ?? data.is_liked ?? false;
};

const getIsError = (data: MessageData): boolean => {
  return data.isError ?? data.is_error ?? false;
};

const getHasImages = (data: MessageData): boolean => {
  return data.hasImages ?? data.has_images ?? false;
};

const getHasCitations = (data: MessageData): boolean => {
  return data.hasCitations ?? data.has_citations ?? false;
};

const getHasToolCalls = (data: MessageData): boolean => {
  return data.hasToolCalls ?? data.has_tool_calls ?? false;
};

const getAttachmentCount = (data: MessageData): number => {
  return data.attachmentCount ?? 0;
};

const getMessageId = (data: MessageData): string | undefined => {
  return data.messageId || data.message_id;
};

export const MessageDetails: React.FC<MessageDetailsProps> = ({
  message,
  isLoading = false,
}) => {
  // Use the correct property name - backend sends 'messageId' (camelCase) not 'message_id'
  const messageId =
    message.messageId || message.message_id || message.id.toString();
  const { data: details, isLoading: isDetailsLoading } =
    useMessageDetails(messageId);

  if (isLoading || isDetailsLoading) {
    return <Skeleton className="w-4 h-4" />;
  }

  // Use detailed data if available, otherwise fall back to basic message data
  const messageData: MessageData = details || message;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:text-foreground transition-colors"
          title="Message details"
        >
          <Icon icon={InformationCircleIcon} size="icon" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Message Details</h3>
            <Badge
              variant={message.role === "assistant" ? "default" : "secondary"}
              className="text-xs"
            >
              {message.role}
            </Badge>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconClock className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Created</span>
              <span className="text-sm text-muted-foreground ml-auto">
                {getCreatedAt(messageData)
                  ? formatDate(new Date(getCreatedAt(messageData)!).getTime())
                  : "N/A"}
              </span>
            </div>

            {getProvider(messageData) && (
              <div className="flex items-center gap-2">
                <IconMessage className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Provider</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {getProvider(messageData)}
                </Badge>
              </div>
            )}

            {getModel(messageData) && (
              <div className="flex items-center gap-2">
                <IconMessage className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Model</span>
                <span className="text-sm text-muted-foreground ml-auto font-mono">
                  {getModel(messageData)}
                </span>
              </div>
            )}

            {/* Generation Stats */}
            <div className="space-y-2 pt-2">
              {(getTokenCount(messageData) ||
                getGenerationTime(messageData) ||
                getTotalCost(messageData)) && (
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Generation Stats
                </h4>
              )}

              {getTokenCount(messageData) && (
                <div className="flex items-center gap-2">
                  <IconMessage className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tokens</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {formatNumber(getTokenCount(messageData)!)}
                  </span>
                </div>
              )}

              {getGenerationTime(messageData) && (
                <div className="flex items-center gap-2">
                  <IconClock className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Generation Time</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {getGenerationTime(messageData)!.toFixed(2)}s
                  </span>
                </div>
              )}

              {getTotalCost(messageData) && (
                <div className="flex items-center gap-2">
                  <IconCoins className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Cost</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {formatCost(getTotalCost(messageData)!)}
                  </span>
                </div>
              )}
            </div>

            {/* Content Stats */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Content
              </h4>

              <div className="flex items-center gap-2">
                <IconMessage className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Characters</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {formatNumber(message.content.length)}
                </span>
              </div>

              {getAttachmentCount(messageData) > 0 && (
                <div className="flex items-center gap-2">
                  <IconFile className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Attachments</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {getAttachmentCount(messageData)}
                  </span>
                </div>
              )}

              {getHasImages(messageData) && (
                <div className="flex items-center gap-2">
                  <IconImageInPicture className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Images</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    Yes
                  </Badge>
                </div>
              )}

              {getHasCitations(messageData) && (
                <div className="flex items-center gap-2">
                  <IconMessage className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Citations</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    Yes
                  </Badge>
                </div>
              )}

              {getHasToolCalls(messageData) && (
                <div className="flex items-center gap-2">
                  <IconTool className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tool Calls</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    Yes
                  </Badge>
                </div>
              )}
            </div>

            {/* Status Information */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </h4>

              <div className="flex items-center gap-2">
                <IconHeart
                  className={`size-4 ${getIsLiked(messageData) ? "text-red-500 fill-current" : "text-muted-foreground"}`}
                />
                <span className="text-sm font-medium">Liked</span>
                <Badge
                  variant={getIsLiked(messageData) ? "default" : "secondary"}
                  className="ml-auto text-xs"
                >
                  {getIsLiked(messageData) ? "Yes" : "No"}
                </Badge>
              </div>

              {getFinishReason(messageData) && (
                <div className="flex items-center gap-2">
                  <IconMessage className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Finish Reason</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {getFinishReason(messageData)}
                  </span>
                </div>
              )}

              {getIsError(messageData) && (
                <div className="flex items-center gap-2">
                  <IconMessage className="size-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">
                    Error
                  </span>
                  <Badge variant="destructive" className="ml-auto text-xs">
                    Yes
                  </Badge>
                </div>
              )}
            </div>

            {/* Message ID */}
            {getMessageId(messageData) && (
              <>
                <Separator />
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <IconMessage className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Message ID</span>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
                    {getMessageId(messageData)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
