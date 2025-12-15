import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { IconPhoto, IconX } from "@tabler/icons-react";
import { memo, useEffect, useMemo, useState } from "react";

interface AttachmentPreviewProps {
  files: File[];
  onRemove: (fileName: string) => void;
  className?: string;
}

const AttachmentPreview = ({
  files,
  onRemove,
  className,
}: AttachmentPreviewProps) => {
  if (files.length === 0) {
    return null;
  }

  // Create local preview URLs and clean them up properly
  const previews = useMemo(() => {
    return files.map((file) => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  return (
    <div className={cn("w-full px-2 lg:px-2 animate-in fade-in-0", className)}>
      <div className="w-full max-w-3xl">
        <ScrollArea className="w-full">
          <div className="flex w-max gap-4 p-4">
            {previews.map((p) => (
              <div key={p.name} className="group relative shrink-0 size-12">
                {p.type.startsWith("image/") ? (
                  <img
                    src={p.url}
                    alt={p.name}
                    className="size-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 rounded-lg bg-muted">
                    <IconPhoto className="size-8" />
                    <p className="max-w-20 truncate px-2 text-xs">{p.name}</p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -right-4 -top-4 bg-foreground/30 size-6"
                  onClick={() => onRemove(p.name)}
                >
                  <IconX className="size-4 text-foreground invert group-hover:text-background" />
                </Button>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};

export default memo(AttachmentPreview);
