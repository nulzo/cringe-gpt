"use client";

import { memo, useMemo } from "react";

import { CitationList } from "./citation-list";
import { ToolCallList } from "./tool-call-list";
import { ImageDisplay } from "./image-display";

import MarkdownRenderer from "@/features/markdown/components/markdown-renderer";
import { SimpleMarkdownRenderer } from "@/features/markdown/components/simple-markdown";
import * as React from "react";

import type { Message } from "@/features/chat/types";
import { addInlineCitations } from "@/features/messages/utils/process-citations";

interface MessageImage {
  id: number;
  name: string;
  url: string;
  mimeType: string;
}

interface MessageBodyProps {
  message: Message;
  isTyping: boolean;
  isCancelled: boolean;
  inlineCitationsEnabled?: boolean;
  images?: MessageImage[];
}

export const MessageBody = memo(
  ({
    message,
    isTyping,
    isCancelled,
    inlineCitationsEnabled = true,
  }: MessageBodyProps) => {
    const messageContent = message.content || "";

    // Always call hooks unconditionally; pick value based on isTyping
    const deferred = React.useDeferredValue(messageContent);

    const displayContent = useMemo(() => {
      let content = isTyping ? deferred : messageContent;

      if (
        isCancelled &&
        typeof content === "string" &&
        content.endsWith("[cancelled]")
      ) {
        content = content.replace("[cancelled]", "");
      }

      if (typeof content === "string") {
        content = content.replace(/\u0000/g, "").replace(/e:$/g, "");
      }

      if (
        inlineCitationsEnabled &&
        message.has_citations &&
        message.citations?.length
      ) {
        content = addInlineCitations(content, message.citations);
      }

      return content;
    }, [
      messageContent,
      deferred,
      isTyping,
      isCancelled,
      message.has_citations,
      message.citations,
      inlineCitationsEnabled,
    ]);

    const isUser = message.role === "user";

    const fileAttachments = Array.isArray(message.attachments)
      ? message.attachments.filter(
          (att) => !att.file_type?.startsWith("image/"),
        )
      : [];

    const normalizedImages = useMemo(() => {
      const allImages = [
        ...(Array.isArray(message.images) ? message.images : []),
        ...(Array.isArray(message.attachments)
          ? message.attachments
              .filter((att) => att.file_type?.startsWith("image/"))
              .map((att, idx) => ({
                id: `${message.id}-attachment-${idx}`,
                url: att.file_path, // Base64 or URL
                name: att.file_name,
                type: "attachment",
              }))
          : []),
      ];

      return allImages
        .map((img: any, index) => {
          const id = img.id || img.Id;
          const url =
            img.url ??
            img.Url ??
            img.image_url?.url ??
            img.image_url?.Url ??
            img.src;
          const name = img.name ?? img.Name ?? img.altText ?? `Image ${index + 1}`;
          const isPersisted = Boolean(id && typeof id !== "string"); // Assuming numeric ID for DB files
          
          // Determine if we should use fileId (for authenticated fetch) or src (for direct/base64)
          // For persisted local files, we must use fileId to go through useGetImage
          // For streams (base64) or remote URLs, we use src
          
          // Heuristic: If it has a numeric ID, treat as persisted file.
          // If it has a 'data:' URL, treat as inline.
          // If it has a remote URL, treat as inline.
          
          return {
            id: id || `${message.id}-img-${index}`,
            fileId: isPersisted ? id : undefined,
            src: isPersisted ? undefined : url, // Only pass src if NOT using fileId fetcher
            altText: name,
            filename: name,
          };
        })
        .filter((img) => img.fileId || img.src);
    }, [message.images, message.attachments, message.id]);

    // Check if we have any images to display
    const hasImages = normalizedImages.length > 0;

    return (
      <>
        {/* Unified Image Display - Handle all types of images */}
        {hasImages && (
          <div className="mb-3 grid w-full max-w-[46rem] grid-cols-2 gap-3 sm:grid-cols-3">
            {normalizedImages.map((img, index) => (
              <ImageDisplay
                key={img.id}
                fileId={img.fileId}
                src={img.src}
                altText={img.altText}
                filename={img.filename}
                className="w-full"
                images={normalizedImages}
                imageIndex={index}
                messageId={message.id}
                conversationId={message.conversation_uuid}
              />
            ))}
          </div>
        )}

        {/* Non-image attachments */}
        {fileAttachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {fileAttachments.map((att) => (
              <div
                key={att.file_name}
                className="flex min-w-[9rem] items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground shadow-sm"
              >
                <p className="truncate text-xs">{att.file_name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Markdown Body - Only render if there's text content or if we're typing */}
        {(displayContent.trim() || isTyping || (!hasImages && !isUser)) && (
          <div
            className={`${
              isUser
                ? "bg-chat-message text-foreground rounded-2xl py-2.5 px-4 sm:px-5 max-w-[38rem] @[48rem]:max-w-[42rem] @[64rem]:max-w-[46rem]"
                : "px-0.5 sm:px-1"
            } ${isCancelled ? "bg-muted/30" : ""}`}
          >
            <div
              className={` w-full max-w-none scroll-smooth leading-7 text-[15px] sm:text-[16px] [&_p:last-child]:mb-0 ${
                isCancelled ? "text-muted-foreground/75" : ""
              }`}
            >
              {isUser ? (
                <SimpleMarkdownRenderer
                  content={displayContent}
                  className="max-w-[38rem] @[48rem]:max-w-[42rem] @[64rem]:max-w-[46rem]"
                />
              ) : (
                <div className="prose dark:invert-prose markdown prose-p:my-3 prose-pre:my-3 prose-ul:my-3 prose-ol:my-3 max-w-[38rem] @[48rem]:max-w-[42rem] @[64rem]:max-w-[46rem]">
                  <MarkdownRenderer
                    markdown={isTyping ? deferred : displayContent}
                  />
                </div>
              )}

              {isTyping && (
                <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-primary/80 rounded-sm" />
              )}
            </div>

            {/* Tool Calls */}
            {Array.isArray(message.tool_calls) &&
              message.tool_calls.length > 0 && (
                <ToolCallList message={message} />
              )}

            {/* Citations */}
            {message.has_citations && (
              <CitationList
                message={message}
                inlineCitationsEnabled={inlineCitationsEnabled}
              />
            )}
          </div>
        )}

        {/* For assistant messages with only images and no text, show a placeholder */}
        {!isUser && hasImages && !displayContent.trim() && !isTyping && (
          <div className="px-1 text-muted-foreground text-sm italic">
            Generated image{(message.images?.length ?? 0) === 1 ? "" : "s"}
          </div>
        )}
      </>
    );
  },
);
