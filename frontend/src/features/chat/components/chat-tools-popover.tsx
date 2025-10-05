import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {IconImageInPicture, IconWorld} from "@tabler/icons-react";
import {useChatConfigStore} from "@/stores/chat-config-store";
import {useModels} from "@/features/models/api/get-models";

interface ChatToolsPopoverProps {
    trigger: React.ReactNode;
    onImageGeneration?: () => void;
}

export const ChatToolsPopover = ({trigger, onImageGeneration}: ChatToolsPopoverProps) => {
    const {selectedModelId} = useChatConfigStore();
    const {data: models} = useModels();

    // Check if the currently selected model supports image generation
    const selectedModel = models?.find(m => m.id === selectedModelId);
    const supportsImageGeneration = selectedModel?.tooling?.supportsImages ?? false;

    const handleImageGeneration = () => {
        if (onImageGeneration) {
            onImageGeneration();
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className="w-fit">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="leading-none font-medium">Tools</h4>
                        <p className="text-muted-foreground text-sm">
                            Select a tool for chatting.
                        </p>
                    </div>
                    <div className="grid gap-1">
                        <Button variant="secondary" className="w-full justify-start">
                            <IconWorld className="size-4"/>
                            Web Search
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full justify-start"
                            disabled={!supportsImageGeneration}
                            onClick={handleImageGeneration}
                        >
                            <IconImageInPicture className="size-4"/>
                            Create an Image
                            {!supportsImageGeneration && (
                                <span className="ml-2 text-xs text-muted-foreground">
                  (Select image model)
                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
