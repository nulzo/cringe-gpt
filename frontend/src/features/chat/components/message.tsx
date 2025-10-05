import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Message as MessageType } from "../types";
import { BotIcon } from "./bot-icon";
import { motion } from "framer-motion";

import { MessageHeader } from "./message-header";
import { MessageActions } from "./message-actions";
import { MessageBody } from "./message-body";
import { MessageError } from "./message-error";
import { MessageLoading } from "./message-loading";
import { ImageSkeleton } from "./image-skeleton";
import { useUpdateMessageLike } from "../api/update-message-like";

// Helper to extract provider from model ID - you can move this to a utils file
const getProviderFromModel = (modelId: string): string | undefined => {
  if (!modelId) return undefined;
  const parts = modelId.split(/[-/]/);
  return parts.length > 1 ? parts[0] : undefined;
};

interface MessageProps {
  message: MessageType;
  isTyping?: boolean;
  isLoading?: boolean;
  isGeneratingImage?: boolean;
  isWaiting?: boolean;
  isCancelled?: boolean;
  onUpdateLike?: (messageId: string | number, isLiked: boolean) => void;
}

// eslint-disable-next-line react/display-name
export const Message = memo(
  forwardRef<HTMLDivElement, MessageProps>(
    (
      {
        message,
        isTyping = false,
        isLoading = false,
        isGeneratingImage = false,
        isWaiting = false,
        isCancelled = false,
        onUpdateLike,
      },
      ref
    ) => {
      // Handle both snake_case (is_liked) and camelCase (isLiked) formats from backend
      const [isLiked, setIsLiked] = useState(
        message.isLiked || message.is_liked || false
      );

      // Track if we're in an optimistic update to prevent prop syncing
      const isOptimisticUpdate = useRef(false);

      // Mock model info - replace with actual model data from your models API
      const modelInfo = useMemo(
        () => ({
          isOnline: true,
          provider:
            message.provider || getProviderFromModel(message.model || ""),
        }),
        [message.provider, message.model]
      );

      const providerName = modelInfo?.provider;
      const isModelOnline = modelInfo?.isOnline || false;

      // Use the new API mutation for updating likes
      const updateLikeMutation = useUpdateMessageLike();

      // Update local state when message prop changes (only when not in optimistic update)
      useEffect(() => {
        if (!isOptimisticUpdate.current) {
          const newIsLiked = message.isLiked || message.is_liked || false;
          setIsLiked(newIsLiked);
        }
      }, [message.isLiked, message.is_liked]);

      // Handle like functionality
      const handleLike = async () => {
        if (updateLikeMutation.isPending) return;

        const newIsLiked = !isLiked;

        // Mark that we're in an optimistic update
        isOptimisticUpdate.current = true;

        // Optimistically update UI
        setIsLiked(newIsLiked);

        try {
          // Call the API to update the like status
          // Use the correct property name - backend sends 'messageId' (camelCase) not 'message_id'
          const messageGuid =
            (message as any).messageId || message.id.toString();
          await updateLikeMutation.mutateAsync({
            messageId: messageGuid,
            isLiked: newIsLiked,
          });

          // Call the callback if provided (for backward compatibility)
          if (onUpdateLike) {
            await onUpdateLike(message.id, newIsLiked);
          }
        } catch (error) {
          // Revert on error
          setIsLiked(!newIsLiked);
          console.error("Failed to update like status:", error);
        } finally {
          // Clear optimistic update flag
          isOptimisticUpdate.current = false;
        }
      };

      // Handle different message states
      if (isWaiting) {
        return (
          <div className="flex flex-col gap-1 py-2">
            <div className="flex gap-3 w-full max-w-[85%]">
              <div className="flex flex-col items-center mb-0">
                <motion.div className="flex items-start gap-3">
                  <BotIcon
                    isOnline={isModelOnline}
                    modelName={message.model}
                    modelId={message.model}
                    provider={providerName}
                  />
                </motion.div>
              </div>
              <div className="flex flex-col">
                <MessageHeader
                  message={message}
                  isModelOnline={isModelOnline}
                  providerName={providerName}
                />
                <div className="bg-muted/30 px-4 py-3 rounded-xl rounded-tl">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">
                      {message.model} is initializing...
                    </span>
                    <Loader2 className="size-3 animate-spin" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (isLoading) {
        return <MessageLoading message={message} />;
      }

      if (isGeneratingImage) {
        return (
          <div className="flex gap-3 w-full max-w-[95%]">
            <div className="flex flex-col items-center mb-0">
              <BotIcon
                isOnline={isModelOnline}
                modelName={message.model}
                modelId={message.model}
                provider={providerName}
              />
            </div>
            <div className="flex flex-col w-full group">
              <MessageHeader
                message={message}
                isModelOnline={isModelOnline}
                providerName={providerName}
              />
              <ImageSkeleton />
            </div>
          </div>
        );
      }

      if (message.is_error) {
        return <MessageError message={message} />;
      }

      const showActions =
        !isTyping && !isLoading && message.role === "assistant";

      return (
        <div className="flex flex-col gap-4" ref={ref}>
          {message.role !== "user" ? (
            <div className="flex gap-3 w-full max-w-[95%]">
              <div className="flex flex-col w-full group">
                <div className="flex flex-row items-end gap-2 mb-1">
                  <BotIcon
                    isOnline={isModelOnline}
                    modelName={message.model}
                    modelId={message.model}
                    provider={providerName}
                  />
                  <MessageHeader
                    message={message}
                    isModelOnline={isModelOnline}
                    providerName={providerName}
                  />
                </div>

                <MessageBody
                  message={message}
                  isTyping={isTyping}
                  isCancelled={isCancelled}
                />
                {showActions && (
                  // <div className="group-hover:opacity-100 opacity-0 transition-all duration-100">
                  <div>
                    <MessageActions
                      message={message}
                      isLiked={isLiked}
                      handleLike={handleLike}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end selection:bg-muted-foreground gap-2">
              <MessageHeader
                message={message}
                isModelOnline={isModelOnline}
                providerName={providerName}
              />
              <div className="flex flex-col justify-end items-end w-full max-w-[70%]">
                <MessageBody
                  message={message}
                  isTyping={isTyping}
                  isCancelled={isCancelled}
                />
              </div>
              <div className="flex items-center justify-end w-full max-w-[70%]">
                <MessageActions
                  message={message}
                  isLiked={false}
                  handleLike={() => {}}
                />
              </div>
            </div>
          )}
        </div>
      );
    }
  ),
  (prevProps, nextProps) => {
    // Performance optimization: only re-render if essential props changed
    return (
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.is_liked === nextProps.message.is_liked &&
      prevProps.message.isLiked === nextProps.message.isLiked &&
      prevProps.isTyping === nextProps.isTyping &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.message.id === nextProps.message.id &&
      prevProps.isCancelled === nextProps.isCancelled
    );
  }
);
