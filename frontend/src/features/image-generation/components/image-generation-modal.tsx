import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconEdit,
  IconPhoto,
  IconSparkles,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useGenerateImage } from "../api/generate-image";
import { type ImageDto, type ImageGenerationRequestDto } from "../api/types";
import { useChatConfigStore } from "@/stores/chat-config-store";
import useNotificationStore from "@/stores/notification-store";

interface ImageGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
}

interface ReferenceImage {
  file: File;
  preview: string;
  type: "reference" | "mask";
}

export function ImageGenerationModal({
  open,
  onOpenChange,
  onImageGenerated,
}: ImageGenerationModalProps) {
  const [prompt, setPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [activeTab, setActiveTab] = useState("create");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);

  const { selectedModelId, selectedProvider } = useChatConfigStore();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const {
    mutate: generateImage,
    data: imageResponse,
    isPending,
    reset,
  } = useGenerateImage({
    onSuccess: (data) => {
      addNotification({
        type: "success",
        title: "Success",
        message: "Image generated successfully",
      });

      // If there's a callback to send the image to chat
      if (onImageGenerated && data.images.length > 0) {
        onImageGenerated(data.images[0].url, prompt);
      }
    },
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Error",
        message: `Image generation failed: ${(error as Error).message}`,
      });
    },
  });

  const handleFileUpload = (
    files: FileList | null,
    type: "reference" | "mask",
  ) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        setReferenceImages((prev) => [...prev, { file, preview, type }]);
      }
    });
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      addNotification({
        type: "error",
        title: "Validation Error",
        message: "Prompt cannot be empty",
      });
      return;
    }

    if (!selectedProvider || !selectedModelId) {
      addNotification({
        type: "error",
        title: "Validation Error",
        message: "A provider and model must be selected",
      });
      return;
    }

    const request: ImageGenerationRequestDto = {
      prompt,
      provider: selectedProvider,
      model: selectedModelId,
      n: 1,
    };

    generateImage(request);
  };

  const handleClose = () => {
    setPrompt("");
    setReferenceImages([]);
    reset();
    onOpenChange(false);
  };

  const examples = [
    "A serene mountain landscape at sunset with realistic lighting",
    "Modern minimalist living room with natural light",
    "Portrait of a wise old wizard with intricate details",
    "Futuristic cityscape with flying cars and neon lights",
    "Cozy coffee shop interior with warm atmosphere",
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSparkles className="size-5 text-primary" />
            AI Image Generation
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <IconPhoto className="size-4" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <IconEdit className="size-4" />
              Edit Image
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="create"
            className="flex-1 flex flex-col space-y-4"
          >
            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe your image</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate in detail..."
                className="min-h-[100px] resize-none"
                disabled={isPending}
              />
            </div>

            {/* Example Prompts */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Try these examples</label>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setPrompt(example)}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Generated Images */}
            {imageResponse && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Generated Images</label>
                <ScrollArea className="h-64">
                  <div className="grid grid-cols-2 gap-4">
                    {imageResponse.images.map(
                      (image: ImageDto, index: number) => (
                        <Card key={image.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <img
                              src={image.url}
                              alt={image.prompt}
                              className="w-full h-48 object-cover"
                            />
                          </CardContent>
                        </Card>
                      ),
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="edit" className="flex-1 flex flex-col space-y-4">
            {/* Reference Images Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reference Images</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-dashed flex flex-col items-center gap-2"
                    disabled={isPending}
                  >
                    <IconUpload className="size-6 text-muted-foreground" />
                    <span className="text-sm">Add Reference Images</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e.target.files, "reference")
                    }
                  />
                </div>

                <div>
                  <Button
                    variant="outline"
                    onClick={() => maskInputRef.current?.click()}
                    className="w-full h-32 border-dashed flex flex-col items-center gap-2"
                    disabled={isPending}
                  >
                    <IconEdit className="size-6 text-muted-foreground" />
                    <span className="text-sm">Add Mask Images</span>
                  </Button>
                  <input
                    ref={maskInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files, "mask")}
                  />
                </div>
              </div>
            </div>

            {/* Reference Images Preview */}
            {referenceImages.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Uploaded Images</label>
                <div className="grid grid-cols-3 gap-2">
                  {referenceImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.preview}
                        alt={`${img.type} ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Badge
                        variant={
                          img.type === "reference" ? "default" : "secondary"
                        }
                        className="absolute top-1 left-1 text-xs"
                      >
                        {img.type}
                      </Badge>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeReferenceImage(index)}
                      >
                        <IconX className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Prompt */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Edit Instructions</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe how you want to modify the reference images..."
                className="min-h-[80px] resize-none"
                disabled={isPending}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedModelId && (
              <Badge variant="outline">{selectedModelId}</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isPending || !prompt.trim()}
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <IconSparkles className="size-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
