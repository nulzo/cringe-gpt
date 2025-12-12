import type React from "react";
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
  fileId?: string | number;
  src?: string;
  altText?: string;
  filename?: string;
  className?: string;
  showControls?: boolean;
  conversationId?: string;
  messageId?: string | number;
  // For multiple images in same message
  images?: Array<{
    id?: string | number;
    fileId?: string | number;
    src?: string;
    altText?: string;
    filename?: string;
  }>;
  imageIndex?: number;
}

export function ImageDisplay({
  fileId,
  src,
  altText = "Generated Image",
  filename,
  className,
  showControls = true,
  conversationId,
  messageId,
  images,
  imageIndex = 0,
}: ImageDisplayProps) {
  const { data: imageBlob, isLoading, isError } = useGetImage(
    src ? undefined : fileId
  );
  const [imageUrl, setImageUrl] = useState<string | null>(src ?? null);
  const [hasLoaded, setHasLoaded] = useState(Boolean(src));
  const { openViewer } = useImageViewer();

  // Populate from direct URL when provided (streamed/remote)
  useEffect(() => {
    if (src) {
      setImageUrl(src);
      setHasLoaded(true);
    }
  }, [src]);

  // Populate from API blob when using stored fileId
  useEffect(() => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setImageUrl(url);
      setHasLoaded(true);
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
    if (!imageBlob && !src) return;

    try {
      let blob = imageBlob;

      if (!blob && src) {
        const response = await fetch(src);
        blob = await response.blob();
      }

      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || (fileId ? `image-${fileId}.png` : "image.png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleOpenViewer = () => {
    const gallery = (images?.length
      ? images
      : [
          {
            fileId,
            src,
            altText,
            filename,
          },
        ]
    ).map((img, index) =>
      createImageData(img.fileId, {
        id: img.id || `${messageId ?? "image"}-${index}`,
        sourceUrl: img.src,
        altText: img.altText || `Image ${index + 1}`,
        filename: img.filename,
        conversationId,
        messageId,
      })
    );

    openViewer(gallery, imageIndex);
  };

  if (isLoading && !hasLoaded) {
    return (
      <div
        className={cn(
          "w-full max-w-sm rounded-xl overflow-hidden border border-border/60 bg-muted/40",
          className
        )}
      >
        <div className="w-full aspect-[4/3] bg-muted animate-pulse flex items-center justify-center rounded-xl">
          <IconPhoto className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          "w-full max-w-sm rounded-xl overflow-hidden border border-destructive/70 bg-destructive/5",
          className
        )}
      >
        <div className="w-full aspect-[4/3] bg-destructive/10 flex flex-col items-center justify-center text-destructive rounded-xl">
          <IconAlertCircle className="w-10 h-10" />
          <p className="mt-2 text-sm font-medium">Could not load image</p>
        </div>
      </div>
    );
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenViewer();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group relative w-full max-w-[18rem] min-w-[11rem] overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-sm transition-all hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
        className
      )}
      onClick={handleOpenViewer}
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full bg-background/60">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={altText}
            className="w-full aspect-[4/3] object-cover sm:object-contain bg-muted"
            onLoad={() => setHasLoaded(true)}
            onError={() => {
              console.warn("Image failed to load:", fileId || src);
            }}
          />
        )}

        {/* Hover/Focus overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />

        {/* Controls */}
        {showControls && imageUrl && (
          <div className="absolute inset-0 flex items-end justify-between p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="pointer-events-none inline-flex max-w-[65%] truncate rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
              {filename || altText}
            </span>
            <div className="pointer-events-auto flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/70 text-white shadow-md hover:bg-black/80"
                onClick={handleDownload}
                aria-label="Download image"
              >
                <IconDownload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
