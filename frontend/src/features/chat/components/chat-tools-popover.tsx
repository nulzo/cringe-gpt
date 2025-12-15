import { Button } from "@/components/ui/button";
import { IconImageInPicture, IconWorld, IconTools } from "@tabler/icons-react";
import { useChatConfigStore } from "@/stores/chat-config-store";
import { useModels } from "@/features/models/api/get-models";
import { ChatFeaturePopover } from "./chat-feature-popover";

interface ChatToolsPopoverProps {
  onImageGeneration?: () => void;
  disabled?: boolean;
}

export const ChatToolsPopover = ({
  onImageGeneration,
  disabled,
}: ChatToolsPopoverProps) => {
  const { selectedModelId } = useChatConfigStore();
  const { data: models } = useModels();

  // Check if the currently selected model supports image generation
  const selectedModel = models?.find((m) => m.id === selectedModelId);
  const supportsImageGeneration =
    selectedModel?.tooling?.supportsImages ?? false;

  const handleImageGeneration = () => {
    if (onImageGeneration) {
      onImageGeneration();
    }
  };

  return (
    <ChatFeaturePopover
      icon={IconTools}
      tooltip="Tools"
      contentClassName="w-fit"
      disabled={disabled}
    >
      <div className="grid gap-4 p-4">
        <div className="space-y-2">
          <h4 className="leading-none font-medium">Tools</h4>
          <p className="text-muted-foreground text-sm">
            Select a tool for chatting.
          </p>
        </div>
        <div className="grid gap-1">
          <Button variant="secondary" className="w-full justify-start">
            <IconWorld className="size-4" />
            Web Search
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-start"
            disabled={!supportsImageGeneration}
            onClick={handleImageGeneration}
          >
            <IconImageInPicture className="size-4" />
            Create an Image
            {!supportsImageGeneration && (
              <span className="ml-2 text-xs text-muted-foreground">
                (Select image model)
              </span>
            )}
          </Button>
        </div>
      </div>
    </ChatFeaturePopover>
  );
};
