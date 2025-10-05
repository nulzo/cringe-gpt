import { Button } from "@/components/ui/button";
import { useGetImage } from "@/features/image-generation/api/get-image";
import { useEffect, useState } from "react";
import { IconAlertCircle, IconDownload, IconPhoto } from "@tabler/icons-react";
import {
  createImageData,
  useImageViewer,
} from "@/context/image-viewer-context";
import { cn } from "@/lib/utils";

interface ImageDisplayProps {
  fileId: string | number;
  altText?: string;
  filename?: string;
  className?: string;
  showControls?: boolean;
  conversationId?: string;
  messageId?: string | number;
  // For multiple images in same message
  images?: Array<{
    fileId: string | number;
    altText?: string;
    filename?: string;
  }>;
  imageIndex?: number;
}

export function ImageDisplay({
  fileId,
  altText = "Generated Image",
  filename,
  className,
  showControls = true,
  conversationId,
  messageId,
  images,
  imageIndex = 0,
}: ImageDisplayProps) {
  const { data: imageBlob, isLoading, isError } = useGetImage(fileId);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { openViewer } = useImageViewer();

  useEffect(() => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setImageUrl(url);
      return () => {
        // Defer cleanup to next tick to avoid race conditions
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 0);
      };
    }
  }, [imageBlob]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageBlob) return;

    try {
      const url = URL.createObjectURL(imageBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `image-${fileId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleOpenViewer = () => {
    // If we have multiple images from the same message, show them all
    if (images && images.length > 1) {
      const imageDataArray = images.map((img, index) =>
        createImageData(img.fileId, {
          id: `${messageId}-${index}`,
          altText: img.altText || `Image ${index + 1}`,
          filename: img.filename,
          conversationId,
          messageId,
        })
      );
      openViewer(imageDataArray, imageIndex);
    } else {
      // Single image
      const imageData = createImageData(fileId, {
        id: `${messageId}-${fileId}`,
        altText,
        filename,
        conversationId,
        messageId,
      });
      openViewer([imageData], 0);
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn("w-full max-w-sm rounded-lg overflow-hidden", className)}
      >
        <div className="w-full aspect-[4/3] bg-muted animate-pulse flex items-center justify-center rounded-lg">
          <IconPhoto className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          "w-full max-w-sm rounded-lg overflow-hidden border border-destructive",
          className
        )}
      >
        <div className="w-full aspect-[4/3] bg-destructive/10 flex flex-col items-center justify-center text-destructive rounded-lg">
          <IconAlertCircle className="w-12 h-12" />
          <p className="mt-2 text-sm font-medium">Could not load image</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-lg overflow-hidden group cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleOpenViewer}
    >
      <div className="relative w-full">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-auto object-contain rounded-lg"
            onError={() => {
              console.warn("Image failed to load:", fileId);
            }}
          />
        )}
        {/* Simple Download Button - Bottom Right */}
        {showControls && isHovered && imageUrl && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white border-0 shadow-lg"
            onClick={handleDownload}
          >
            <IconDownload className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
