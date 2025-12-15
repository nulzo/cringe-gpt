import { useMemo, useState } from "react";
import { Command, CommandInput, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconUserCircle,
  IconX,
  IconCheck,
  IconPlus,
} from "@tabler/icons-react";
import {
  usePersonas,
  useCreatePersona,
} from "@/features/personas/api/get-personas";
import type { PersonaPayload } from "@/features/personas/types";
import { useChatConfigStore } from "@/stores/chat-config-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatFeaturePopover } from "./chat-feature-popover";

export function PersonaSelector() {
  const personasQuery = usePersonas();
  const createPersona = useCreatePersona();
  const {
    setActivePersona,
    clearPersona,
    setTemperature,
    setTopP,
    setTopK,
    setMaxTokens,
    setSystemPrompt,
    setIsTemporary,
    activePersonaName,
    activePersonaId,
    selectedProvider,
    selectedModelId,
  } = useChatConfigStore();

  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [draft, setDraft] = useState<PersonaPayload>({
    name: "",
    description: "",
    instructions: "",
    parameters: {
      temperature: 0.7,
      topP: 0.9,
      topK: 0.4,
      maxTokens: 4096,
      isTemporary: false,
    },
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return personasQuery.data ?? [];
    return (personasQuery.data ?? []).filter(
      (persona) =>
        persona.name.toLowerCase().includes(term) ||
        persona.description?.toLowerCase().includes(term),
    );
  }, [search, personasQuery.data]);

  const applyPersona = (personaId: number) => {
    const persona = (personasQuery.data ?? []).find((p) => p.id === personaId);
    if (!persona) return;

    setActivePersona(persona.id, persona.name);
    setSystemPrompt(persona.instructions);
    if (persona.parameters?.temperature != null)
      setTemperature(Number(persona.parameters.temperature));
    if (persona.parameters?.topP != null)
      setTopP(Number(persona.parameters.topP));
    if (persona.parameters?.topK != null)
      setTopK(Number(persona.parameters.topK));
    if (persona.parameters?.maxTokens != null)
      setMaxTokens(persona.parameters.maxTokens || null);
    if (persona.parameters?.isTemporary != null)
      setIsTemporary(Boolean(persona.parameters.isTemporary));
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!draft.name.trim() || !draft.instructions.trim()) return;
    try {
      const payload: PersonaPayload = {
        ...draft,
        provider: selectedProvider ?? "OpenAi",
        model: selectedModelId ?? "gpt-4o-mini",
        parameters: {
          temperature: draft.parameters?.temperature ?? undefined,
          topP: draft.parameters?.topP ?? undefined,
          topK: draft.parameters?.topK ?? undefined,
          maxTokens: draft.parameters?.maxTokens ?? undefined,
          isTemporary: draft.parameters?.isTemporary ?? undefined,
        },
      };
      const created = await createPersona.mutateAsync(payload);
      if (created?.id) {
        personasQuery.refetch();
        setDraft((prev) => ({
          ...prev,
          name: "",
          description: "",
          instructions: "",
        }));
        setIsDialogOpen(false);
        applyPersona(created.id);
      }
    } catch (error) {
      console.error("Failed to create persona", error);
    }
  };

  return (
    <>
      <ChatFeaturePopover
        open={open}
        onOpenChange={setOpen}
        icon={IconUserCircle}
        tooltip={
          activePersonaName ? `Persona: ${activePersonaName}` : "Select persona"
        }
        isIndicatorActive={!!activePersonaName}
        className={cn(
          activePersonaName &&
            "bg-accent/40 text-foreground border border-border/60",
        )}
        contentClassName="w-[400px] p-0 bg-popover/95 backdrop-blur-sm border-border/50 shadow-2xl rounded-xl overflow-hidden"
      >
        <Command shouldFilter={false} className="bg-transparent">
          <div className="border-b border-border/40 p-1">
            <CommandInput
              placeholder="Search personas..."
              value={search}
              onValueChange={setSearch}
              className="h-10 text-sm"
            />
          </div>
          <CommandList className="max-h-[360px] p-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No personas found
              </div>
            ) : (
              filtered.map((persona) => {
                const isActive = persona.id === activePersonaId;
                return (
                  <div
                    key={persona.id}
                    role="option"
                    tabIndex={0}
                    onClick={() => {
                      applyPersona(persona.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        applyPersona(persona.id);
                        setOpen(false);
                        setSearch("");
                      }
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none transition-colors",
                      "hover:bg-accent/50",
                      isActive
                        ? "bg-accent/70 text-accent-foreground"
                        : "text-foreground",
                    )}
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {persona.name}
                        </span>
                      </div>
                      {persona.description && (
                        <span className="text-xs text-muted-foreground truncate opacity-80">
                          {persona.description}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <IconCheck className="ml-3 size-4 shrink-0 text-primary" />
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
              onClick={() => {
                clearPersona();
                setSystemPrompt("");
                setOpen(false);
              }}
            >
              <IconX className="size-3.5 mr-1.5" />
              Clear
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs hover:bg-background"
              onClick={() => setIsDialogOpen(true)}
            >
              <IconPlus className="size-3.5 mr-1.5" />
              New Persona
            </Button>
          </div>
        </Command>
      </ChatFeaturePopover>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Create persona</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="persona-name">Name</Label>
              <Input
                id="persona-name"
                value={draft.name}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Research assistant"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="persona-description">Description</Label>
              <Input
                id="persona-description"
                value={draft.description ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Concise, analytical tone..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="persona-instructions">System prompt</Label>
              <Textarea
                id="persona-instructions"
                value={draft.instructions}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    instructions: e.target.value,
                  }))
                }
                placeholder="You are a helpful assistant..."
                className="min-h-[140px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Temperature</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.parameters?.temperature ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        temperature: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Top P</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.parameters?.topP ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        topP: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Top K</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={draft.parameters?.topK ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        topK: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Max tokens</Label>
                <Input
                  type="number"
                  value={draft.parameters?.maxTokens ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        maxTokens: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="persona-temp"
                checked={draft.parameters?.isTemporary ?? false}
                onCheckedChange={(checked) =>
                  setDraft((prev) => ({
                    ...prev,
                    parameters: {
                      ...prev.parameters,
                      isTemporary: Boolean(checked),
                    },
                  }))
                }
              />
              <Label htmlFor="persona-temp">
                Ephemeral conversation (do not save history)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createPersona.isPending}>
              Save persona
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
