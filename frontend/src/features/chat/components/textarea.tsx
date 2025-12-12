import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  IconAdjustments,
  IconPaperclip,
  IconSend,
  IconTools,
  IconWand,
} from "@tabler/icons-react";
import type { ModelResponse } from "@/types/api";
import { ModelSelect } from "@/features/models/components/model-select";
import {
  type ProviderType,
  useChatConfigStore,
} from "@/stores/chat-config-store";
import { useModels } from "@/features/models/api/get-models";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AttachmentPreview from "./attachment-preview";
import { ChatAreaActionButton } from "./chat-area-action-button";
import { ChatSettingsPopover } from "./chat-settings-popover";
import { ImageGenerationModal } from "@/features/image-generation/components/image-generation-modal";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { IconPlayerStop } from "@tabler/icons-react";
import { filterValidAttachments } from "../utils/attachments";
import { PersonaSelector } from "./persona-selector";
import { PromptPicker } from "./prompt-picker";

interface ModernChatAreaProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: (message: string) => void;
  models?: ModelResponse[];
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  onAttachments: (files: File[]) => void;
  attachments: File[];
  onRemoveAttachment: (fileName: string) => void;
  mode?: "welcome" | "chat";
}

export function ModernChatArea({
  value,
  onChange,
  onSendMessage,
  onAttachments,
  attachments,
  onRemoveAttachment,
  placeholder = "Ask anything...",
  minHeight = 1,
  maxHeight = 10,
  disabled = false,
  mode = "chat",
}: ModernChatAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const isInputEmpty = value.trim().length === 0;

  const { data: models } = useModels();
  const { selectedModelId, setSelectedModel } = useChatConfigStore();
  const isStreaming = useChatStore((s) => s.isStreaming);
  const cancelStream = useChatStore((s) => s.cancelStream);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const maxPx = maxHeight * 16;
    textarea.style.height = `${Math.min(scrollHeight, maxPx)}px`;
    textarea.style.overflowY = scrollHeight > maxPx ? "auto" : "hidden";
  }, [value, maxHeight]);

  const handleSend = () => {
    if (!isInputEmpty && !disabled) {
      onSendMessage(value);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleModelChange = (modelId: string) => {
    const selectedModel = models?.find((m) => m.id === modelId);
    if (selectedModel) {
      const providerMap: Record<string, ProviderType> = {
        ollama: "Ollama",
        openai: "OpenAi",
        anthropic: "Anthropic",
        openrouter: "OpenRouter",
        google: "Google",
      };

      const provider =
        providerMap[selectedModel.provider.toLowerCase()] || "Ollama";
      setSelectedModel(modelId, provider);
    }
  };

  const canSend = !isInputEmpty && !disabled && selectedModelId && !isStreaming;

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const filtered = filterValidAttachments(Array.from(files));
      if (filtered.length > 0) onAttachments(filtered);
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if the pasted item is an image
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          // Create a new file with a proper name
          const timestamp = Date.now();
          const extension = file.type.split("/")[1] || "png";
          const fileName = `pasted-image-${timestamp}.${extension}`;

          // Create a new File object with the proper name
          const renamedFile = new File([file], fileName, { type: file.type });
          imageFiles.push(renamedFile);
        }
      }
    }

    if (imageFiles.length > 0) {
      event.preventDefault(); // Prevent default paste behavior for images
      const filtered = filterValidAttachments(imageFiles);
      if (filtered.length > 0) onAttachments(filtered);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    const imageMessage = `Generated image: ${prompt}\n![Generated Image](${imageUrl})`;
    onSendMessage(imageMessage);
    setIsImageModalOpen(false);
  };

  const containerClasses =
    mode === "welcome"
      ? "[--thread-content-max-width:32rem] @[34rem]:[--thread-content-max-width:40rem] @[64rem]:[--thread-content-max-width:48rem] mx-auto max-w-(--thread-content-max-width) flex-1"
      : "[--thread-content-max-width:32rem] @[34rem]:[--thread-content-max-width:40rem] @[64rem]:[--thread-content-max-width:48rem] mx-auto max-w-(--thread-content-max-width) flex-1";

  const textareaContainerClasses = `
    mx-auto w-full
    flex flex-col rounded-3xl sm:rounded-4xl
    bg-input shadow-sm
    p-2.5 sm:p-2
    transition-all duration-200 ease-out
    transform border border-border dark:border-border/25
    ${mode === "welcome" ? "scale-100" : "scale-100"}
    ${isDragging ? "border-primary/80 shadow-lg scale-[1.01]" : ""}
  `;

  return (
    <>
      <div
        className={containerClasses}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className={textareaContainerClasses}>
          <AttachmentPreview
            files={attachments}
            onRemove={onRemoveAttachment}
          />
          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              rows={1}
              aria-label="Message input"
              disabled={disabled}
              className="w-full resize-none bg-transparent px-3 py-2 text-[15px] sm:text-[16px] leading-6 sm:leading-7 text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-0 scrollbar-none disabled:opacity-50 disabled:cursor-not-allowed max-h-36 min-h-8"
              style={{
                minHeight: `${minHeight}rem`,
                maxHeight: `${maxHeight}rem`,
              }}
            />
          </div>

          {/* Buttons row */}
          <div className="relative flex items-center justify-between px-1">
            <div className="flex gap-1">
              <ModelSelect
                value={selectedModelId || undefined}
                onValueChange={handleModelChange}
              />


              <PersonaSelector />
              
              <PromptPicker />

              {/* <ChatToolsPopover
                onImageGeneration={() => setIsImageModalOpen(true)}
                disabled={disabled}
              /> */}

              <ChatSettingsPopover disabled={disabled} />

              {/* File upload */}
              <>
                <ChatAreaActionButton
                  as="label"
                  tooltipText="Attach File"
                  icon={IconPaperclip}
                  htmlFor="file-upload"
                  disabled={disabled}
                />

                <input
                  id="file-upload"
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  disabled={disabled}
                />
              </>
            </div>

            <div className="flex gap-2">
              <ChatAreaActionButton
                tooltipText="Enhance Prompt"
                icon={IconWand}
                disabled={disabled || isInputEmpty}
              />

              {isStreaming ? (
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      onClick={cancelStream}
                      aria-label="Cancel streaming"
                      variant="destructive"
                      size="icon"
                    >
                      <IconPlayerStop className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop generating</TooltipContent>
                </Tooltip>
              ) : (
                  <ChatAreaActionButton
                    onClick={handleSend}
                    aria-label="Send"
                    tooltipText="Send"
                    icon={IconSend}
                    disabled={disabled || isInputEmpty || !canSend}
                  />
              )}
            </div>
          </div>
        </div>
      </div>

      <ImageGenerationModal
        open={isImageModalOpen}
        onOpenChange={setIsImageModalOpen}
        onImageGenerated={handleImageGenerated}
      />
    </>
  );
}
