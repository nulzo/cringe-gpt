import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { IconSparkles, IconUserCircle, IconX, IconCheck } from '@tabler/icons-react';
import { usePersonas, useCreatePersona } from '@/features/personas/api/get-personas';
import type { PersonaPayload } from '@/features/personas/types';
import { useChatConfigStore } from '@/stores/chat-config-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [search, setSearch] = useState('');

  const [draft, setDraft] = useState<PersonaPayload>({
    name: '',
    description: '',
    instructions: '',
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
        persona.description?.toLowerCase().includes(term)
    );
  }, [search, personasQuery.data]);

  const applyPersona = (personaId: number) => {
    const persona = (personasQuery.data ?? []).find((p) => p.id === personaId);
    if (!persona) return;

    setActivePersona(persona.id, persona.name);
    setSystemPrompt(persona.instructions);
    if (persona.parameters?.temperature != null) setTemperature(Number(persona.parameters.temperature));
    if (persona.parameters?.topP != null) setTopP(Number(persona.parameters.topP));
    if (persona.parameters?.topK != null) setTopK(Number(persona.parameters.topK));
    if (persona.parameters?.maxTokens != null) setMaxTokens(persona.parameters.maxTokens || null);
    if (persona.parameters?.isTemporary != null) setIsTemporary(Boolean(persona.parameters.isTemporary));
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!draft.name.trim() || !draft.instructions.trim()) return;
    try {
      const payload: PersonaPayload = {
        ...draft,
        provider: selectedProvider ?? 'OpenAi',
        model: selectedModelId ?? 'gpt-4o-mini',
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
        setDraft((prev) => ({ ...prev, name: '', description: '', instructions: '' }));
        setIsDialogOpen(false);
        applyPersona(created.id);
      }
    } catch (error) {
      console.error('Failed to create persona', error);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            role="combobox"
            aria-expanded={open}
            variant="ghost"
            size="icon"
            className={cn(
              "relative h-9 w-9 rounded-md bg-transparent hover:bg-hover transition-all",
              activePersonaName && "bg-accent/40 text-foreground border border-border/60"
            )}
            aria-label={activePersonaName ? `Persona: ${activePersonaName}` : "Select persona"}
          >
            {activePersonaName && (
              <span
                aria-hidden
                className="absolute -top-1 -right-1 size-2 rounded-full bg-primary shadow-[0_0_0_2px_var(--popover-background,_#111)]"
              />
            )}
            <IconUserCircle className="size-4" />
            {!activePersonaName && <span className="sr-only">Select persona</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[520px] shadow-lg border-border/60 bg-popover"
          align="start"
          side="bottom"
        >
          <Command shouldFilter={false}>
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <CommandInput
                placeholder="Search personas..."
                value={search}
                onValueChange={setSearch}
                className="h-9 flex-1"
              />
            </div>
            <CommandList className="max-h-[420px]">
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No personas yet
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
                        setSearch('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          applyPersona(persona.id);
                          setOpen(false);
                          setSearch('');
                        }
                      }}
                      className={cn(
                        "relative flex h-12 w-full cursor-pointer items-center rounded-lg px-3 mx-1 my-0.5 w-[calc(100%-8px)] transition-colors",
                        isActive ? "bg-accent text-accent-foreground border border-border/60" : "hover:bg-accent/80"
                      )}
                    >
                      <div className="flex flex-col w-full gap-0.5">
                        <div className="flex items-center justify-between w-full text-sm font-medium">
                          <span className="truncate">{persona.name}</span>
                          <span className="text-[11px] text-muted-foreground ml-2 shrink-0">
                            {isActive ? "Active" : "Persona"}
                          </span>
                        </div>
                        {persona.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 w-full">
                            {persona.description}
                          </p>
                        )}
                      </div>
                      {isActive && <IconCheck className="size-4 shrink-0 ml-2" />}
                    </div>
                  );
                })
              )}
            </CommandList>
            <div className="flex items-center justify-between gap-2 p-4 border-t border-border/60 bg-muted/40">
              <Button variant="ghost" size="sm" onClick={() => { clearPersona(); setSystemPrompt(''); setOpen(false); }}>
                <IconX className="size-4 mr-2" />
                Clear
              </Button>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                New persona
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

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
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Research assistant"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="persona-description">Description</Label>
              <Input
                id="persona-description"
                value={draft.description ?? ''}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Concise, analytical tone..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="persona-instructions">System prompt</Label>
              <Textarea
                id="persona-instructions"
                value={draft.instructions}
                onChange={(e) => setDraft((prev) => ({ ...prev, instructions: e.target.value }))}
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
                  value={draft.parameters?.temperature ?? ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      parameters: { ...prev.parameters, temperature: Number(e.target.value) },
                    }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Top P</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.parameters?.topP ?? ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      parameters: { ...prev.parameters, topP: Number(e.target.value) },
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
                  value={draft.parameters?.topK ?? ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      parameters: { ...prev.parameters, topK: Number(e.target.value) },
                    }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Max tokens</Label>
                <Input
                  type="number"
                  value={draft.parameters?.maxTokens ?? ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      parameters: { ...prev.parameters, maxTokens: Number(e.target.value) },
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
                    parameters: { ...prev.parameters, isTemporary: Boolean(checked) },
                  }))
                }
              />
              <Label htmlFor="persona-temp">Ephemeral conversation (do not save history)</Label>
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
