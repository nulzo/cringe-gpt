import { useState } from "react";
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
  usePersonas,
  useCreatePersona,
} from "@/features/personas/api/get-personas";
import type { PersonaPayload } from "@/features/personas/types";
import { useChatConfigStore } from "@/stores/chat-config-store";
import { Button } from "@/components/ui/button";
import { IconUser } from "@tabler/icons-react";
import { GenericResourceSelector } from "./generic-resource-selector";

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

  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const applyPersona = (persona: any) => {
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
        setDraft({
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
        setIsDialogOpen(false);
        applyPersona(created);
      }
    } catch (error) {
      console.error("Failed to create persona", error);
    }
  };

  return (
    <>
      <GenericResourceSelector
        items={personasQuery.data ?? []}
        activeId={activePersonaId}
        activeLabel={activePersonaName}
        onSelect={applyPersona}
        onClear={() => {
          clearPersona();
          // System prompt clearing is now handled by store's clearPersona
        }}
        onCreate={() => setIsDialogOpen(true)}
        icon={IconUser}
        tooltip="Select persona"
        searchPlaceholder="Search personas..."
        emptyMessage="No personas found"
        getSearchTerms={(persona) => [
          persona.name,
          persona.description || "",
        ]}
        renderItem={(persona, isSelected) => (
          <div className="flex flex-col gap-1 min-w-0 flex-1 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">{persona.name}</span>
            </div>
            {persona.description && (
              <span className="text-xs text-muted-foreground truncate opacity-80">
                {persona.description}
              </span>
            )}
          </div>
        )}
      />

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
