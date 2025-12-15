import React from "react";
import { FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Message } from "../types";
import { processCitations } from "../utils/process-citations";

interface CitationListProps {
  message: Message;
  inlineCitationsEnabled?: boolean;
}

export const CitationList: React.FC<CitationListProps> = ({
  message,
  inlineCitationsEnabled = true,
}) => {
  if (
    !message.has_citations ||
    !message.citations ||
    message.citations.length === 0
  ) {
    return null;
  }

  // Clean up citations before displaying
  const cleanedCitations = processCitations(message.citations);

  return (
    <div className="mt-2 pt-2 border-t border-border">
      <div className="flex items-center gap-1 mb-1 text-muted-foreground text-xs">
        <Info size={12} />
        <span>Sources:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {cleanedCitations.map((citation, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 h-7 text-xs"
                  onClick={() => {
                    // You can implement navigation to the knowledge document here
                    console.log(
                      "Navigate to knowledge document",
                      citation.knowledge_id,
                    );
                  }}
                >
                  <FileText size={12} />
                  <span className="max-w-[200px] truncate">
                    {inlineCitationsEnabled
                      ? `[${index + 1}] ${citation.text}`
                      : citation.text}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start">
                <div className="text-xs">
                  <div className="font-semibold">{citation.text}</div>
                  {citation.metadata?.source && (
                    <div>Source: {citation.metadata.source}</div>
                  )}
                  {citation.metadata?.page && (
                    <div>Page: {citation.metadata.page}</div>
                  )}
                  {citation.metadata?.row && (
                    <div>Row: {citation.metadata.row}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};
