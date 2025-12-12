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
  IconX,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import { useGetImage } from "@/features/image-generation/api/get-image";
import { useAnimationStore } from "@/stores/animation-store";
import type { ImageData } from "@/context/image-viewer-context";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DEFAULT_ZOOM = 2.25;

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

  const currentImage = images[currentIndex];
  const minSwipeDistance = 50;
  const isZoomed = scale > 1;

  // Fetch current image blob
  const {
    data: imageBlob,
    isLoading: isFetching,
    isError,
  } = useGetImage(currentImage?.sourceUrl ? undefined : currentImage?.fileId);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Memoized image URL creation
  useEffect(() => {
    // Direct URL (inline/remote)
    if (currentImage?.sourceUrl) {
      setImageUrl(currentImage.sourceUrl);
      setIsLoading(false);
      return undefined;
    }

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
  }, [currentImage?.sourceUrl, imageBlob]);

  useEffect(() => {
    if (isFetching) {
      setIsLoading(true);
    }
  }, [isFetching]);

  // Keep index in sync with caller when reopening viewer
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  // Reset zoom and pan when changing images
  useEffect(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }, [currentIndex]);

  const resetTransform = useCallback(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const applyZoom = useCallback(
    (nextScale: number, origin?: { x: number; y: number }) => {
      const target = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      const container = containerRef.current;

      if (!container) {
        setScale(target);
        if (target === MIN_SCALE) {
          setPanX(0);
          setPanY(0);
        }
        return;
      }

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const originX = (origin?.x ?? centerX) - centerX;
      const originY = (origin?.y ?? centerY) - centerY;

      setScale((prevScale) => {
        const ratio = target / prevScale;

        setPanX((prevPanX) =>
          target === MIN_SCALE ? 0 : prevPanX + originX * (1 - ratio)
        );
        setPanY((prevPanY) =>
          target === MIN_SCALE ? 0 : prevPanY + originY * (1 - ratio)
        );

        return target;
      });
    },
    []
  );

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetTransform();
    setIsLoading(true);
  }, [images.length, resetTransform]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetTransform();
    setIsLoading(true);
  }, [images.length, resetTransform]);

  // Optimized zoom functions with hardware acceleration
  const toggleZoom = useCallback(() => {
    if (scale > 1) {
      resetTransform();
    } else {
      applyZoom(DEFAULT_ZOOM);
    }
  }, [applyZoom, resetTransform, scale]);

  const zoomIn = useCallback(() => {
    applyZoom(scale * 1.35);
  }, [applyZoom, scale]);

  const zoomOut = useCallback(() => {
    const newScale = scale / 1.35;
    applyZoom(newScale <= MIN_SCALE ? MIN_SCALE : newScale);
  }, [applyZoom, scale]);

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
    [images.length, nextImage, onClose, prevImage, toggleZoom]
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
    if (!currentImage) return;

    try {
      let blob = imageBlob;

      // Fetch remote images when we only have a URL
      if (!blob && currentImage.sourceUrl) {
        const response = await fetch(currentImage.sourceUrl);
        blob = await response.blob();
      }

      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        currentImage.filename ||
        (currentImage.fileId ? `image-${currentImage.fileId}.png` : "image.png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

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

  // Wheel zoom with smooth scaling around cursor
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = Math.exp(-e.deltaY * 0.0025);
      applyZoom(scale * zoomFactor, { x: e.clientX, y: e.clientY });
    },
    [applyZoom, scale]
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
      transform: `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`,
      willChange: "transform",
      transformOrigin: "center center",
      transition: isDraggingRef.current ? "none" : "transform 0.18s ease-out",
    }),
    [panX, panY, scale]
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
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                onClose?.();
              }
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="text-white text-center space-y-3">
              <IconX className="w-12 h-12 mx-auto" />
              <p className="text-sm text-white/80">Failed to load image</p>
              <Button variant="outline" onClick={onClose} className="mt-2">
                Close
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="fixed inset-0 bg-[#0a0a0f]/90 backdrop-blur-sm z-50 flex items-center justify-center"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Top bar */}
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/40 via-black/10 to-transparent px-5 pt-4 pb-8"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex items-start justify-between text-white">
                <div className="pointer-events-auto flex flex-wrap items-center gap-2 max-w-[60vw]">
                  <Badge className="bg-white/15 text-white border-white/20">
                    {currentIndex + 1} / {images.length}
                  </Badge>
                  <span className="truncate text-sm text-white/80">
                    {currentImage.filename ||
                      (currentImage.fileId
                        ? `image-${currentImage.fileId}`
                        : "Image")}
                  </span>
                </div>
                <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/30 px-1.5 py-1 backdrop-blur">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={zoomOut}
                    className="text-white hover:bg-white/15"
                    disabled={scale <= MIN_SCALE}
                  >
                    <IconZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => applyZoom(MIN_SCALE)}
                    className="text-white hover:bg-white/15"
                    disabled={scale === MIN_SCALE}
                  >
                    1x
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={zoomIn}
                    className="text-white hover:bg-white/15"
                  >
                    <IconZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={downloadImage}
                    className="text-white hover:bg-white/15"
                    disabled={!imageBlob && !currentImage.sourceUrl}
                  >
                    <IconDownload className="h-4 w-4" />
                  </Button>
                  {onClose && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="text-white hover:bg-white/15"
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/15 h-12 w-12"
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/15 h-12 w-12"
                  >
                    <IconChevronRight className="h-6 w-6" />
                  </Button>
                </motion.div>
              </>
            )}

            {/* Main Content */}
            <motion.div
              className="flex-1 flex items-center justify-center p-6 pt-18 h-full pb-8"
              variants={viewerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  onClose?.();
                }
              }}
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
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    applyZoom(scale > 1 ? MIN_SCALE : DEFAULT_ZOOM, {
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
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
                      className="max-w-[92vw] max-h-[calc(100vh-9rem)] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
                      onLoad={() => setIsLoading(false)}
                      onError={() => {
                        console.warn(
                          "Image failed to load:",
                          currentImage.fileId || currentImage.sourceUrl
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
                className="absolute bottom-4 left-1/2 -translate-x-1/2"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex gap-2 p-2 bg-black/40 rounded-full backdrop-blur-sm max-w-[90vw] overflow-x-auto">
                  {images.map((image, index) => (
                    <ImageThumbnail
                      key={image.id}
                      image={image}
                      isActive={index === currentIndex}
                      onClick={() => {
                        setCurrentIndex(index);
                        resetTransform();
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
  const { data: imageBlob } = useGetImage(
    image.sourceUrl ? undefined : image.fileId
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (image.sourceUrl) {
      setThumbnailUrl(image.sourceUrl);
      return;
    }

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
  }, [image.sourceUrl, imageBlob]);

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
