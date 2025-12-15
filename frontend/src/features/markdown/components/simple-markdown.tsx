"use client";

import { marked } from "marked";
import React from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

export function SimpleMarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const html = React.useMemo(() => {
    const raw = marked.parse(content, { async: false });
    if (typeof raw !== "string") {
      throw new Error("Expected marked.parse() to return a string");
    }
    return DOMPurify.sanitize(raw);
  }, [content]);

  return (
    <div
      className={cn(
        "markdown break-words overflow-hidden [&_pre]:overflow-x-auto [&_pre>code]:whitespace-pre [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
