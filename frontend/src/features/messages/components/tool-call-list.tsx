import React from "react";
import { ChevronDown, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { Message } from "@/features/chat/types";

interface ToolCallListProps {
  message: Message;
}

export const ToolCallList: React.FC<ToolCallListProps> = ({ message }) => {
  if (
    !message.has_tool_calls ||
    !message.tool_calls ||
    message.tool_calls.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-2 pt-2 border-t border-border">
      <div className="flex items-center gap-1 mb-2 text-muted-foreground text-xs">
        <Wrench size={12} />
        <span>Tool Calls ({message.tool_calls.length})</span>
      </div>
      <div className="space-y-2">
        {message.tool_calls.map((toolCall, index) => (
          <Collapsible key={toolCall.id || index}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto text-left"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {toolCall.function.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {toolCall.type}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 pb-2">
              <div className="text-xs space-y-2">
                <div>
                  <span className="font-medium text-muted-foreground">
                    Arguments:
                  </span>
                  <pre className="mt-1 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(
                      JSON.parse(toolCall.function.arguments || "{}"),
                      null,
                      2,
                    )}
                  </pre>
                </div>
                {toolCall.result && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Result:
                    </span>
                    <pre className="mt-1 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
                      {JSON.stringify(toolCall.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};
