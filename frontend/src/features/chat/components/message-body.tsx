"use client";

import { memo, useMemo } from "react";
import { IconPhoto } from "@tabler/icons-react";

import { CitationList } from "./citation-list";
import { ToolCallList } from "./tool-call-list";
import { ImageDisplay } from "./image-display";

import MarkdownRenderer from "@/features/markdown/components/markdown-renderer";
import { SimpleMarkdownRenderer } from "@/features/markdown/components/simple-markdown";
import * as React from "react";

import type { Message } from "../types";
import { addInlineCitations } from "../utils/process-citations";
// import { useGetImage } from "@/features/image-generation/api/get-image";

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
    }, [messageContent, deferred, isTyping, isCancelled, message.has_citations, message.citations, inlineCitationsEnabled]);

    const isUser = message.role === "user";

    // Normalized image buckets
    const processedImages = Array.isArray(message.images)
      ? message.images.filter((img: any) => Boolean((img as any)?.id))
      : [];
    const inlineImages = Array.isArray(message.images)
      ? message.images.filter((img: any) => {
          const u = img?.image_url?.url ?? img?.image_url?.Url ?? img?.url ?? img?.Url;
          return !img?.id && Boolean(u);
        })
      : [];

    // Check if we have any images to display
    const hasImages =
      processedImages.length > 0 ||
      inlineImages.length > 0 ||
      (Array.isArray(message.attachments) && message.attachments.length > 0);

    return (
      <>
        {/* Unified Image Display - Handle all types of images */}
        {hasImages && (
          <div className="mb-2 flex flex-wrap gap-2">
            {/* Persisted images (ids map to /files) */}
            {processedImages.map((img: any, index) => (
              <ImageDisplay
                key={`processed-image-${img.id || index}`}
                fileId={img.id}
                altText={img.name || `Image ${index + 1}`}
                className="max-w-24"
                images={processedImages.map((im: any) => ({
                  fileId: im.id,
                  altText: im.name,
                }))}
                imageIndex={index}
                messageId={message.id}
                conversationId={message.conversation_uuid}
              />
            ))}

            {/* Streaming/remote image URLs (data URLs or hosted) */}
            {inlineImages.map((img: any, idx) => {
              const url = img?.image_url?.url ?? img?.image_url?.Url ?? img?.url ?? img?.Url;
              const alt = img?.type === "image_url" ? img?.alt ?? img?.name : `Image ${idx + 1}`;
              return (
                <div
                  key={`inline-image-${idx}-${url}`}
                  className="relative max-w-24 rounded-lg overflow-hidden border bg-muted/40"
                >
                  <img
                    src={url}
                    alt={alt}
                    className="w-full h-auto object-contain rounded-lg"
                    onError={(e) => {
                      console.error("Failed to load streamed image:", url);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              );
            })}

            {/* User attachments fallback */}
            {processedImages.length === 0 &&
              inlineImages.length === 0 &&
              Array.isArray(message.attachments) &&
              message.attachments.map((att) => (
                <div
                  key={att.file_name}
                  className="relative max-w-24 rounded-lg overflow-hidden"
                >
                  {att.file_type.startsWith("image/") ? (
                    <img
                      src={att.file_path}
                      alt={att.file_name}
                      className="w-full h-auto object-contain rounded-lg"
                      onError={(e) => {
                        console.error("Failed to load attachment:", att.file_path);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 bg-muted rounded-lg">
                      <IconPhoto className="size-8" />
                      <p className="max-w-20 truncate px-2 text-xs">
                        {att.file_name}
                      </p>
                    </div>
                  )}
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
                  <MarkdownRenderer markdown={isTyping ? deferred : displayContent} />
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
  }
);
