import {
    ArrowDown10,
    ArrowDownAZ,
    ArrowDownUp,
    ArrowDownWideNarrow,
    ArrowUp01,
    ArrowUpAZ,
    ArrowUpNarrowWide,
    ChevronsUpDown,
    Eye,
    Filter,
    Wrench,
} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Command, CommandEmpty, CommandInput, CommandList,} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Badge} from "@/components/ui/badge";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {type ModelResponse} from "@/types/api";
import {useModels} from "@/features/models/api/get-models";
import React, {type ComponentType, Suspense, useMemo, useRef, useState,} from "react";
import {useVirtualizer} from "@tanstack/react-virtual";
import {getProviderKeyFromModel, ProviderIcon,} from "@/components/ui/provider-icon";
import {PROVIDERS} from "@/configuration/const";
import {OpenRouter} from "@lobehub/icons";
import {IconAlertCircle, IconArrowDown, IconArrowUp, IconInfoCircle,} from "@tabler/icons-react";
import MarkdownRenderer from "@/features/markdown/components/markdown-renderer";
import { useUIState } from "@/shared/layout/ui-state-provider";

interface ModelSelectProps {
    value?: string;
    onValueChange: (value: string) => void;
    className?: string;
}

type SortKey =
    | "provider"
    | "name_asc"
    | "name_desc"
    | "context_desc"
    | "context_asc"
    | "price_asc"
    | "price_desc";
("use client");

const formatPrice = (pricePerMillion: number | undefined): string | null => {
    if (pricePerMillion === undefined || pricePerMillion === null) return null;
    if (pricePerMillion === 0) return "Free";
    if (pricePerMillion > 0) return `$${pricePerMillion.toFixed(2)}`;
    return null;
};
const formatContextLength = (length: number): string => {
    if (length >= 1_000_000) return `${(length / 1_000_000).toFixed(1)}M`;
    if (length >= 1_000) return `${Math.round(length / 1000)}K`;
    return length.toString();
};
const sortOptions: Record<
    SortKey,
    { label: string; icon: ComponentType<{ className?: string }> }
> = {
    provider: {label: "Provider", icon: ArrowDownUp},
    name_asc: {label: "Name (A-Z)", icon: ArrowDownAZ},
    name_desc: {label: "Name (Z-A)", icon: ArrowUpAZ},
    context_desc: {label: "Context (High-Low)", icon: ArrowDownWideNarrow},
    context_asc: {label: "Context (Low-High)", icon: ArrowUpNarrowWide},
    price_asc: {label: "Price (Low-High)", icon: ArrowUp01},
    price_desc: {label: "Price (High-Low)", icon: ArrowDown10},
};

function ModelSelectHeader({
                               search,
                               setSearch,
                               sortKey,
                               setSortKey,
                               allProviders,
                               selectedProviders,
                               setSelectedProviders,
                           }: {
    search: string;
    setSearch: (search: string) => void;
    sortKey: SortKey;
    setSortKey: (sortKey: SortKey) => void;
    allProviders: string[];
    selectedProviders: string[];
    setSelectedProviders: (providers: string[]) => void;
}) {
    return (
        <div className="flex items-center gap-2 border-b px-3 py-2 w-full">
            <CommandInput
                placeholder="Search models..."
                value={search}
                onValueChange={setSearch}
                className="h-9 flex-1 w-full"
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-9 shrink-0">
                        {React.createElement(sortOptions[sortKey].icon, {
                            className: "size-4",
                        })}
                        <span className="sr-only">
              Sort by {sortOptions[sortKey].label}
            </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    {Object.entries(sortOptions).map(([key, {label, icon: Icon}]) => (
                        <DropdownMenuCheckboxItem
                            key={key}
                            checked={sortKey === key}
                            onSelect={() => setSortKey(key as SortKey)}
                            className="flex items-center gap-2"
                        >
                            <Icon className="size-3 text-muted-foreground"/>
                            <span>{label}</span>
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative size-9 shrink-0"
                    >
                        <Filter className="size-4"/>
                        <span className="sr-only">Filter by provider</span>
                        {selectedProviders.length > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -right-1 -top-1 size-4 justify-center rounded-full p-0 text-xs"
                            >
                                {selectedProviders.length}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel>Filter by Provider</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <ScrollArea className="h-64">
                        {allProviders.map((provider) => (
                            <DropdownMenuCheckboxItem
                                key={provider}
                                checked={selectedProviders.includes(provider)}
                                onSelect={(e) => {
                                    e.preventDefault();
                                    const newSelection = selectedProviders.includes(provider)
                                        ? selectedProviders.filter((p) => p !== provider)
                                        : [...selectedProviders, provider];
                                    setSelectedProviders(newSelection);
                                }}
                            >
                                {provider.charAt(0).toUpperCase() + provider.slice(1)}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </ScrollArea>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function ModelFeatureBadge({
                               icon: Icon,
                               tooltipContent,
                               children,
                               isSelected,
                               isTextBadge = false,
                               className,
                           }: {
    icon?: ComponentType<{ className?: string }>;
    tooltipContent: React.ReactNode;
    children?: React.ReactNode;
    isSelected: boolean;
    isTextBadge?: boolean;
    className?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className={cn(
                        "flex items-center justify-center rounded",
                        // Different padding for icon badges vs text badges
                        isTextBadge ? "px-1.5 py-0.5 text-[10px] font-light" : "p-1",
                        // Background color based on selection state
                        isSelected ? "bg-accent-foreground/10" : "bg-accent",
                        className
                    )}
                >
                    {Icon && <Icon className="size-3 text-muted-foreground"/>}
                    {children}
                </div>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                align="center"
                className="max-w-xs [&_a]:text-foreground"
            >
                {tooltipContent}
            </TooltipContent>
        </Tooltip>
    );
}

function ModelSelectList({
                             groupedModels,
                             value,
                             onValueChange,
                             setOpen,
                             setSearch,
                             onOpenSettings,
                         }: {
    groupedModels: Record<string, ModelResponse[]>;
    value?: string;
    onValueChange: (value: string) => void;
    setOpen: (open: boolean) => void;
    setSearch: (search: string) => void;
    onOpenSettings: () => void;
}) {
    const parentRef = useRef<HTMLDivElement>(null);
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const flatItems = useMemo(() => {
        // ... (This logic remains unchanged)
        const items: (
            | { type: "header"; provider: string; key: string }
            | { type: "model"; model: ModelResponse; key: string }
            )[] = [];
        Object.entries(groupedModels).forEach(([provider, models]) => {
            items.push({type: "header", provider, key: `header-${provider}`});
            models.forEach((model) => {
                items.push({type: "model", model, key: model.id});
            });
        });
        return items;
    }, [groupedModels]);

    const rowVirtualizer = useVirtualizer({
        // ... (This logic remains unchanged)
        count: flatItems.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => (flatItems[index].type === "header" ? 36 : 44),
        overscan: 10,
    });

    if (flatItems.length === 0) {
        return (
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                <div className="space-y-3">
                    <p>No models available. Add an API key in Settings to load models.</p>
                    <Button variant="outline" size="sm" onClick={onOpenSettings}>
                        Open Settings
                    </Button>
                </div>
            </CommandEmpty>
        );
    }

    // The main rendering logic with the improvements:
    return (
        <CommandList ref={parentRef} className="max-h-[400px]">
            <TooltipProvider delayDuration={100}>
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const item = flatItems[virtualItem.index];
                        const isSelected = item.type === "model" && item.model.id === value;

                        return (
                            <div
                                key={virtualItem.key}
                                data-index={virtualItem.index}
                                ref={rowVirtualizer.measureElement}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    transform: `translateY(${virtualItem.start}px)`,
                                    padding: "0 0.5rem",
                                }}
                            >
                                {item.type === "header" ? (
                                    <div className="flex h-9 items-baseline gap-2 px-2 pt-2 text-sm font-semibold">
                                        <span>{capitalize(item.provider)}</span>
                                    </div>
                                ) : (
                                    <div
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => {
                                            onValueChange(item.model.id);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                        // Note: The outer Tooltip and TooltipTrigger are gone
                                        className={cn(
                                            "relative flex h-10 w-full cursor-pointer items-center rounded-lg p-2",
                                            "hover:bg-accent/80",
                                            isSelected && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        <div className="flex w-full items-center gap-2">
                                            <div className="ml-2 flex items-center justify-center">
                                                <ProviderIcon size={24} model={item.model}/>
                                            </div>
                                            <p
                                                className="flex-1 truncate text-sm font-medium"
                                                title={item.model.name}
                                            >
                                                {item.model.name}
                                            </p>
                                            {/* === BADGES SECTION: REFACTORED === */}
                                            <div className="ml-auto flex shrink-0 items-center gap-1">
                                                {item.model.description && (
                                                    <ModelFeatureBadge
                                                        icon={IconInfoCircle}
                                                        isSelected={isSelected}
                                                        tooltipContent={
                                                            <div className="p-1 text-left">
                                                                <p className="text-xs">
                                                                    <MarkdownRenderer
                                                                        markdown={item.model.description}
                                                                    />
                                                                </p>
                                                            </div>
                                                        }
                                                    />
                                                )}
                                                {item.model.tooling.supportsVision && (
                                                    <ModelFeatureBadge
                                                        icon={Eye}
                                                        isSelected={isSelected}
                                                        tooltipContent="Vision enabled"
                                                    />
                                                )}
                                                {(item.model.tooling.supportsTools || item.model.tooling.supportsFunctionCalling) && (
                                                    <ModelFeatureBadge
                                                        icon={Wrench}
                                                        isSelected={isSelected}
                                                        tooltipContent="Tool use (function calling) enabled"
                                                    />
                                                )}
                                                {item.model.tooling.supportsStreaming && (
                                                    <ModelFeatureBadge
                                                        isSelected={isSelected}
                                                        isTextBadge={true}
                                                        tooltipContent="Streaming responses"
                                                    >
                                                        Stream
                                                    </ModelFeatureBadge>
                                                )}
                                                {item.model.tooling.supportsCodeExecution && (
                                                    <ModelFeatureBadge
                                                        isSelected={isSelected}
                                                        isTextBadge={true}
                                                        tooltipContent="Code execution"
                                                    >
                                                        Code
                                                    </ModelFeatureBadge>
                                                )}
                                                {item.model.tooling.isExperimental && (
                                                    <ModelFeatureBadge
                                                        isSelected={isSelected}
                                                        isTextBadge={true}
                                                        tooltipContent="Experimental model"
                                                    >
                                                        Exp
                                                    </ModelFeatureBadge>
                                                )}
                                                {item.model.provider.toLowerCase() ===
                                                    PROVIDERS.OpenRouter.toLowerCase() && (
                                                        <ModelFeatureBadge
                                                            icon={OpenRouter}
                                                            isSelected={isSelected}
                                                            tooltipContent="OpenRouter model"
                                                        />
                                                    )}
                                                <ModelFeatureBadge
                                                    isSelected={isSelected}
                                                    isTextBadge={true}
                                                    tooltipContent="Max context length"
                                                >
                                                    {formatContextLength(item.model.contextLength)}
                                                </ModelFeatureBadge>

                                                {/* Only show pricing badge if we have pricing data */}
                                                {(item.model.pricing.promptCostPerMillionTokens !== undefined ||
                                                  item.model.pricing.completionCostPerMillionTokens !== undefined) && (
                                                    <ModelFeatureBadge
                                                        isSelected={isSelected}
                                                        isTextBadge={true}
                                                        tooltipContent="Input / Output price per 1M tokens"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <IconArrowUp className="size-3"/>
                                                            <span>
                                                                {formatPrice(item.model.pricing.promptCostPerMillionTokens) || "N/A"}
                                                            </span>
                                                            <IconArrowDown className="size-3 ml-1"/>
                                                            <span>
                                                                {formatPrice(item.model.pricing.completionCostPerMillionTokens) || "N/A"}
                                                            </span>
                                                        </div>
                                                    </ModelFeatureBadge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </TooltipProvider>
        </CommandList>
    );
}

function ModelSelectInner({
                              value,
                              onValueChange,
                              className,
                          }: ModelSelectProps) {
    const {data: models} = useModels();
    const { openSettingsModal } = useUIState();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("provider");
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

    const {allProviders, groupedModels} = useMemo(() => {
        if (!models) return {allProviders: [], groupedModels: {}};

        // Get all unique base providers
        const availableProviders = [
            ...new Set(models.map((m) => getProviderKeyFromModel(m))),
        ].sort();

        let filtered = models.filter((model) => {
            const baseProvider = getProviderKeyFromModel(model);
            return (
                (search === "" ||
                    model.name.toLowerCase().includes(search.toLowerCase()) ||
                    baseProvider.toLowerCase().includes(search.toLowerCase())) &&
                (selectedProviders.length === 0 ||
                    selectedProviders.includes(baseProvider))
            );
        });

        filtered.sort((a, b) => {
            const baseProviderA = getProviderKeyFromModel(a);
            const baseProviderB = getProviderKeyFromModel(b);

            switch (sortKey) {
                case "name_asc":
                    return a.name.localeCompare(b.name);
                case "name_desc":
                    return b.name.localeCompare(a.name);
                case "context_asc":
                    return a.contextLength - b.contextLength;
                case "context_desc":
                    return b.contextLength - a.contextLength;
                case "price_asc":
                    return (
                        (a.pricing.promptCostPerMillionTokens ?? Infinity) -
                        (b.pricing.promptCostPerMillionTokens ?? Infinity)
                    );
                case "price_desc":
                    return (
                        (b.pricing.promptCostPerMillionTokens ?? 0) -
                        (a.pricing.promptCostPerMillionTokens ?? 0)
                    );
                case "provider":
                default:
                    return (
                        baseProviderA.localeCompare(baseProviderB) ||
                        a.name.localeCompare(b.name)
                    );
            }
        });

        // Group by base provider instead of the provider field
        const grouped = filtered.reduce<Record<string, ModelResponse[]>>(
            (acc, model) => {
                const baseProvider = getProviderKeyFromModel(model);
                (acc[baseProvider] = acc[baseProvider] || []).push(model);
                return acc;
            },
            {}
        );

        return {allProviders: availableProviders, groupedModels: grouped};
    }, [models, search, sortKey, selectedProviders]);

    const selectedModel = useMemo(
        () => models?.find((m) => m.id === value),
        [models, value]
    );

    if (!models || models.length === 0) {
        return (
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-9 w-9 p-0 rounded-md bg-transparent hover:bg-hover transition-all")}
                            onClick={openSettingsModal}
                            aria-label="No models yet, open settings"
                        >
                            <IconAlertCircle className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                        <p className="text-sm font-medium">No models yet</p>
                        <p className="text-xs text-muted-foreground">Open Settings to add API keys</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button
                                role="combobox"
                                aria-expanded={open}
                                size="icon"
                                className={cn(
                                    "p-0 rounded-md bg-transparent hover:bg-hover transition-all duration-200 hover:cursor-pointer",
                                    className
                                )}
                            >
                                {selectedModel ? (
                                    <div className="flex size-7 shrink-0 items-center justify-center">
                                        <ProviderIcon model={selectedModel}/>
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                                        <ChevronsUpDown className="w-4 h-4 text-muted-foreground"/>
                                    </div>
                                )}
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                        <div className="text-center">
                            {selectedModel ? (
                                <>
                                    <p className="font-medium">{selectedModel.name}</p>
                                </>
                            ) : (
                                <p>Select a model</p>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-[550px] p-0" align="start" side="bottom">
                <Command shouldFilter={false}>
                    <ModelSelectHeader
                        search={search}
                        setSearch={setSearch}
                        sortKey={sortKey}
                        setSortKey={setSortKey}
                        allProviders={allProviders}
                        selectedProviders={selectedProviders}
                        setSelectedProviders={setSelectedProviders}
                    />
                    {/* The virtualized list is rendered here */}
                    <ModelSelectList
                        groupedModels={groupedModels}
                        value={value}
                        onValueChange={onValueChange}
                        setOpen={setOpen}
                        setSearch={setSearch}
                        onOpenSettings={openSettingsModal}
                    />
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// --- EXPORTED SUSPENSE WRAPPER (Unchanged) ---

export function ModelSelect(props: ModelSelectProps) {
    const loadingFallback = (
        <Button variant="ghost" className="h-12 w-full justify-start" disabled>
            <div
                className="mr-2 size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"/>
            Loading models...
        </Button>
    );
    return (
        <Suspense fallback={loadingFallback}>
            <ModelSelectInner {...props} />
        </Suspense>
    );
}
