"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconRotateClockwise,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import { useGetImage } from "@/features/image-generation/api/get-image";
import { useAnimationStore } from "@/stores/animation-store";

interface ImageData {
  id: string | number;
  fileId: string | number;
  filename?: string;
  fileType?: string;
  fileSize?: string;
  dimensions?: string;
  description?: string;
  altText: string;
}

interface ImageViewerProps {
  images: ImageData[];
  initialIndex?: number;
  onClose?: () => void;
  isOpen: boolean;
}

// Define animation variants outside component
const createOverlayVariants = (animationsEnabled: boolean) => ({
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: animationsEnabled ? 0.2 : 0,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: animationsEnabled ? 0.15 : 0,
    },
  },
});

const createViewerVariants = (animationsEnabled: boolean) => ({
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: animationsEnabled ? 0.2 : 0,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: animationsEnabled ? 0.15 : 0,
    },
  },
});

export function ImageViewer({
  images,
  initialIndex = 0,
  onClose,
  isOpen,
}: ImageViewerProps) {
  const { animationsEnabled } = useAnimationStore();

  // Create animation variants that respect user preferences
  const overlayVariants = createOverlayVariants(animationsEnabled);
  const viewerVariants = createViewerVariants(animationsEnabled);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // High-performance zoom and pan state
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Refs for performance-critical operations
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Removed useTransition for simpler state management

  const currentImage = images[currentIndex];
  const minSwipeDistance = 50;
  const isZoomed = scale > 1;

  // Fetch current image blob
  const {
    data: imageBlob,
    isLoading: isFetching,
    isError,
  } = useGetImage(currentImage?.fileId);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Memoized image URL creation
  useEffect(() => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setImageUrl(url);
      setIsLoading(false);
      return () => {
        // Defer cleanup to next tick to avoid race conditions
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 0);
      };
    }
  }, [imageBlob]);

  useEffect(() => {
    if (isFetching) {
      setIsLoading(true);
    }
  }, [isFetching]);

  // Reset zoom and pan when changing images
  useEffect(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
  }, [currentIndex]);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setScale(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setIsLoading(true);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setScale(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setIsLoading(true);
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          if (images.length > 1) nextImage();
          break;
        case "ArrowLeft":
          if (images.length > 1) prevImage();
          break;
        case "Escape":
          onClose?.();
          break;
        case " ":
          e.preventDefault();
          toggleZoom();
          break;
      }
    },
    [nextImage, prevImage, onClose, isZoomed, images.length]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown, isOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      nextImage();
    } else if (isRightSwipe && images.length > 1) {
      prevImage();
    }
  };

  const downloadImage = async () => {
    if (!imageBlob || !currentImage) return;

    try {
      const url = URL.createObjectURL(imageBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        currentImage.filename || `image-${currentImage.fileId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Optimized zoom functions with hardware acceleration
  const toggleZoom = useCallback(() => {
    if (scale > 1) {
      // Zoom out
      setScale(1);
      setPanX(0);
      setPanY(0);
    } else {
      // Zoom in to 2x
      setScale(2);
    }
  }, [scale]);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.5, 5)); // Max 5x zoom
  }, []);

  const zoomOut = useCallback(() => {
    const newScale = scale / 1.5;
    if (newScale <= 1) {
      setScale(1);
      setPanX(0);
      setPanY(0);
    } else {
      setScale(newScale);
    }
  }, [scale]);

  const rotateImage = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Simplified and reliable drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return; // Only allow dragging when zoomed in

      e.preventDefault();
      isDraggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    },
    [scale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current || !lastPointerRef.current || scale <= 1)
        return;

      e.preventDefault();

      const deltaX = e.clientX - lastPointerRef.current.x;
      const deltaY = e.clientY - lastPointerRef.current.y;

      setPanX((prev) => prev + deltaX);
      setPanY((prev) => prev + deltaY);

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    },
    [scale]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    lastPointerRef.current = null;
  }, []);

  // Global mouse events to prevent stuck drag state
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
      lastPointerRef.current = null;
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !lastPointerRef.current || scale <= 1)
        return;

      const deltaX = e.clientX - lastPointerRef.current.x;
      const deltaY = e.clientY - lastPointerRef.current.y;

      setPanX((prev) => prev + deltaX);
      setPanY((prev) => prev + deltaY);

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("mousemove", handleGlobalMouseMove);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [scale]);

  // Wheel zoom with smooth scaling
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY * -0.01;
      const newScale = Math.max(1, Math.min(5, scale + delta));

      setScale(newScale);
      if (newScale <= 1) {
        setPanX(0);
        setPanY(0);
      }
    },
    [scale]
  );

  // Add non-passive wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  // Memoized transform style for maximum performance
  const imageTransform = useMemo(
    () => ({
      transform: `translate3d(${panX}px, ${panY}px, 0) scale(${scale}) rotate(${rotation}deg)`,
      willChange: "transform",
      transformOrigin: "center center",
      transition: isDraggingRef.current ? "none" : "transform 0.2s ease-out",
    }),
    [panX, panY, scale, rotation]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isDraggingRef.current = false;
      lastPointerRef.current = null;
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isOpen &&
        currentImage &&
        (isError ? (
          <motion.div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="text-white text-center">
              <IconX className="w-12 h-12 mx-auto mb-4" />
              <p>Failed to load image</p>
              <Button variant="outline" onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <motion.div
              className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-white/20"
                  >
                    {currentIndex + 1} / {images.length}
                  </Badge>
                  <span className="text-sm opacity-80">
                    {currentImage.filename || `image-${currentImage.fileId}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={rotateImage}
                    className="text-white hover:bg-white/20"
                  >
                    <IconRotateClockwise className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={zoomOut}
                    className="text-white hover:bg-white/20"
                    disabled={scale <= 1}
                  >
                    <IconZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={zoomIn}
                    className="text-white hover:bg-white/20"
                  >
                    <IconZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={downloadImage}
                    className="text-white hover:bg-white/20"
                    disabled={!imageBlob}
                  >
                    <IconDownload className="h-4 w-4" />
                  </Button>
                  {onClose && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="text-white hover:bg-white/20"
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <motion.div
                  variants={overlayVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                  >
                    <IconChevronLeft className="h-6 w-6" />
                  </Button>
                </motion.div>
                <motion.div
                  variants={overlayVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                  >
                    <IconChevronRight className="h-6 w-6" />
                  </Button>
                </motion.div>
              </>
            )}

            {/* Main Content */}
            <motion.div
              className="flex-1 flex items-center justify-center p-4 pt-18 h-full pb-4"
              variants={viewerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center"
                style={{ contain: "layout style paint" }}
              >
                <div
                  className={`relative ${
                    isZoomed
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-zoom-in"
                  }`}
                  style={imageTransform}
                  onClick={!isZoomed ? toggleZoom : undefined}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                  {imageUrl && (
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      alt={currentImage.altText}
                      className="max-w-[95vw] max-h-[calc(100vh-8rem)] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
                      onLoad={() => setIsLoading(false)}
                      onError={() => {
                        console.warn(
                          "Image failed to load:",
                          currentImage.fileId
                        );
                        setIsLoading(false);
                      }}
                      draggable={false}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "translateZ(0)", // Force hardware acceleration
                      }}
                    />
                  )}
                </div>
              </div>
            </motion.div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <motion.div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 md:bottom-auto md:top-20 md:left-4 md:translate-x-0"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex md:flex-col gap-2 p-2 bg-black/50 rounded-lg backdrop-blur-sm max-w-[90vw] md:max-w-none overflow-x-auto md:overflow-y-auto md:max-h-[60vh]">
                  {images.map((image, index) => (
                    <ImageThumbnail
                      key={image.id}
                      image={image}
                      isActive={index === currentIndex}
                      onClick={() => {
                        setCurrentIndex(index);
                        setScale(1);
                        setPanX(0);
                        setPanY(0);
                        setRotation(0);
                        setIsLoading(true);
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
    </AnimatePresence>
  );
}

// Separate thumbnail component to optimize rendering
function ImageThumbnail({
  image,
  isActive,
  onClick,
}: {
  image: ImageData;
  isActive: boolean;
  onClick: () => void;
}) {
  const { data: imageBlob } = useGetImage(image.fileId);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setThumbnailUrl(url);
      return () => {
        // Defer cleanup to next tick to avoid race conditions
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 0);
      };
    }
  }, [imageBlob]);

  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden transition-all duration-200 ${
        isActive
          ? "ring-2 ring-white scale-110"
          : "opacity-60 hover:opacity-100"
      }`}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={image.altText}
          className="w-full h-full object-cover"
          onError={() => {
            console.warn("Thumbnail failed to load:", image.fileId);
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-600 animate-pulse" />
      )}
    </button>
  );
}
