import { useState, useMemo } from "react";
import { Command, CommandInput, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatFeaturePopover } from "./chat-feature-popover";
import { IconX, IconPlus, IconCheck } from "@tabler/icons-react";
import type { Icon as TablerIcon } from "@tabler/icons-react";

export interface ResourceSelectorProps<T> {
  // Data
  items: T[];
  activeId?: number | string | null;
  activeLabel?: string | null;
  
  // Handlers
  onSelect: (item: T) => void;
  onClear: () => void;
  onCreate?: () => void;
  
  // Rendering
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  getSearchTerms: (item: T) => string[];
  
  // UI Configuration
  icon: any; // Using any to support different icon libraries if needed, though Tabler is preferred
  tooltip: string;
  searchPlaceholder: string;
  emptyMessage: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function GenericResourceSelector<T extends { id: number | string }>({
  items,
  activeId,
  activeLabel,
  onSelect,
  onClear,
  onCreate,
  renderItem,
  getSearchTerms,
  icon,
  tooltip,
  searchPlaceholder,
  emptyMessage,
  className,
  side = "top",
}: ResourceSelectorProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return items;
    return items.filter((item) => 
      getSearchTerms(item).some(t => t.toLowerCase().includes(term))
    );
  }, [search, items, getSearchTerms]);

  const handleSelect = (item: T) => {
    onSelect(item);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onClear();
    setOpen(false);
    setSearch("");
  };

  return (
    <ChatFeaturePopover
      open={open}
      onOpenChange={setOpen}
      icon={icon}
      tooltip={activeLabel ? `${tooltip}: ${activeLabel}` : tooltip}
      isIndicatorActive={!!activeLabel}
      className={cn(
        activeLabel && "bg-accent/40 text-foreground border border-border/60",
        className
      )}
      contentClassName="w-[400px] p-0 bg-popover/95 backdrop-blur-sm border-border/50 shadow-2xl rounded-xl overflow-hidden"
      side={side}
    >
      <Command shouldFilter={false} className="bg-transparent">
        <div className="border-b border-border/40 p-1">
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            className="h-10 text-sm"
          />
        </div>
        <CommandList className="max-h-[360px] p-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = item.id === activeId;
              return (
                <div
                  key={item.id}
                  role="option"
                  tabIndex={0}
                  onClick={() => handleSelect(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(item);
                    }
                  }}
                  className={cn(
                    "relative cursor-pointer select-none rounded-md transition-colors outline-none",
                    "hover:bg-accent/50",
                    isSelected
                      ? "bg-accent/70 text-accent-foreground"
                      : "text-foreground"
                  )}
                >
                  {renderItem(item, isSelected)}
                  {isSelected && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <IconCheck className="size-4 text-primary" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CommandList>
        <div className="flex items-center justify-between p-2 border-t border-border/40 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <IconX className="size-3.5 mr-1.5" />
            Clear
          </Button>
          {onCreate && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs hover:bg-background"
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
            >
              <IconPlus className="size-3.5 mr-1.5" />
              New {tooltip.split(" ")[1] || "Item"}
            </Button>
          )}
        </div>
      </Command>
    </ChatFeaturePopover>
  );
}

