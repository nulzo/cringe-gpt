import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProviderIcon } from "@/components/ui/provider-icon";
import type { ModelResponse } from "@/types/api";

interface BotIconProps {
  isOnline?: boolean;
  modelName?: string;
  modelId?: string;
  provider?: string;
}

export const BotIcon = ({
  isOnline,
  modelName,
  modelId,
  provider,
}: BotIconProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const modelForIcon: Partial<ModelResponse> = {
    id: modelId,
    provider: provider,
  };

  const canShowIcon = modelId || provider;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <div className="relative flex justify-center items-center">
                {canShowIcon ? (
                  <ProviderIcon
                    model={modelForIcon as ModelResponse}
                    className="rounded-[10px]"
                    size={32}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-md bg-muted/50">
                    <span className="text-sm font-semibold text-muted-foreground">
                      ?
                    </span>
                  </div>
                )}
                <div
                  className={`absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-3 ring-background
                  ${
                    isOnline
                      ? "bg-green-500"
                      : "bg-background border border-foreground/75"
                  }`}
                />
              </div>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {modelName} is {isOnline ? "online" : "offline"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Dialog>
  );
};
