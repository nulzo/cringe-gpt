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
    const attachmentImages = Array.isArray(message.attachments)
      ? message.attachments.filter((att) => att.file_type?.startsWith("image/"))
      : [];
    const fileAttachments = Array.isArray(message.attachments)
      ? message.attachments.filter((att) => !att.file_type?.startsWith("image/"))
      : [];

    const normalizedImages = [
      ...processedImages.map((img: any, index) => ({
        id: img.id || `${message.id}-stored-${index}`,
        fileId: img.id,
        altText: img.name || `Image ${index + 1}`,
        filename: img.name,
      })),
      ...inlineImages.map((img: any, idx) => {
        const url =
          img?.image_url?.url ?? img?.image_url?.Url ?? img?.url ?? img?.Url;
        const alt =
          img?.type === "image_url" ? img?.alt ?? img?.name : `Image ${idx + 1}`;
        return {
          id: `${message.id}-inline-${idx}`,
          src: url,
          altText: alt,
          filename: img?.name || undefined,
        };
      }),
      ...attachmentImages.map((att, idx) => ({
        id: `${message.id}-attachment-${idx}`,
        src: att.file_path,
        altText: att.file_name,
        filename: att.file_name,
      })),
    ].filter(Boolean);

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
                <IconPhoto className="size-5 text-muted-foreground" />
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
