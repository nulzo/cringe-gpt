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
import { IconHash, IconX, IconPlus } from "@tabler/icons-react";
import {
  usePrompts,
  useCreatePrompt,
} from "@/features/prompts/api/get-prompts";
import type {
  Prompt,
  PromptPayload,
  PromptVariable,
} from "@/features/prompts/types";
import { useChatConfigStore } from "@/stores/chat-config-store";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatFeaturePopover } from "./chat-feature-popover";

const renderTemplate = (template: string, values: Record<string, string>) => {
  if (!template) return "";
  return template.replace(
    /{{\s*(\w+)\s*}}/g,
    (_, key) => values[key] ?? `{{${key}}}`,
  );
};

const inferVariables = (content: string): PromptVariable[] => {
  const matches = Array.from(content.matchAll(/{{\s*(\w+)\s*}}/g)).map(
    (m) => m[1],
  );
  const unique = Array.from(new Set(matches));
  return unique.map((name) => ({ name, label: name, required: true }));
};

export function PromptPicker() {
  const promptsQuery = usePrompts();
  const createPrompt = useCreatePrompt();
  const { setActivePrompt, clearPrompt, setPromptVariables } =
    useChatConfigStore();
  const { setInputValue } = useChatStore();

  const [open, setOpen] = useState(false);
  const [variablePrompt, setVariablePrompt] = useState<Prompt | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {},
  );
  const [search, setSearch] = useState("");

  const [draft, setDraft] = useState<{
    title: string;
    content: string;
    tags: string;
  }>({
    title: "",
    content: "",
    tags: "",
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return promptsQuery.data ?? [];
    return (promptsQuery.data ?? []).filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(term) ||
        prompt.content.toLowerCase().includes(term) ||
        prompt.tags?.some((t) => t.name.toLowerCase().includes(term)),
    );
  }, [search, promptsQuery.data]);

  const applyPrompt = (prompt: Prompt, values: Record<string, string> = {}) => {
    setActivePrompt(prompt.id, prompt.title);
    setPromptVariables(values);
    const rendered = renderTemplate(prompt.content, values);
    setInputValue(rendered);
    setOpen(false);
    setVariablePrompt(null);
  };

  const handlePromptSelect = (prompt: Prompt) => {
    if (prompt.variables && prompt.variables.length > 0) {
      const defaults: Record<string, string> = {};
      prompt.variables.forEach((v) => {
        defaults[v.name] = variableValues[v.name] ?? "";
      });
      setVariableValues(defaults);
      setVariablePrompt(prompt);
    } else {
      applyPrompt(prompt);
    }
  };

  const handleCreate = async () => {
    if (!draft.title.trim() || !draft.content.trim()) return;
    const variables = inferVariables(draft.content);
    const payload: PromptPayload = {
      title: draft.title,
      content: draft.content,
      tags: draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      variables,
    };
    try {
      const created = await createPrompt.mutateAsync(payload);
      if (created?.id) {
        promptsQuery.refetch();
        setDraft({ title: "", content: "", tags: "" });
        applyPrompt(created, {});
      }
    } catch (error) {
      console.error("Failed to create prompt", error);
    }
  };

  return (
    <>
      <ChatFeaturePopover
        open={open}
        onOpenChange={setOpen}
        icon={IconHash}
        tooltip="Select prompt"
        contentClassName="w-[400px] p-0 bg-popover/95 backdrop-blur-sm border-border/50 shadow-2xl rounded-xl overflow-hidden"
        side="bottom"
      >
        <Command shouldFilter={false} className="bg-transparent">
          <div className="border-b border-border/40 p-1">
            <CommandInput
              placeholder="Search prompts..."
              value={search}
              onValueChange={setSearch}
              className="h-10 text-sm"
            />
          </div>
          <CommandList className="max-h-[320px] p-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No prompts found
              </div>
            ) : (
              filtered.map((prompt) => (
                <div
                  key={prompt.id}
                  role="option"
                  onClick={() => {
                    handlePromptSelect(prompt);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none transition-colors",
                    "hover:bg-accent/50",
                  )}
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {prompt.title}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                        {prompt.variables?.length
                          ? `${prompt.variables.length} vars`
                          : "static"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 opacity-80">
                      {prompt.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CommandList>
          <div className="flex items-center justify-between p-2 border-t border-border/40 bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                clearPrompt();
                setVariablePrompt(null);
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
              onClick={() => setIsCreateOpen(true)}
            >
              <IconPlus className="size-3.5 mr-1.5" />
              New Prompt
            </Button>
          </div>
        </Command>
      </ChatFeaturePopover>

      {/* Variable fill dialog */}
      <Dialog
        open={Boolean(variablePrompt)}
        onOpenChange={(open) => !open && setVariablePrompt(null)}
      >
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {variablePrompt ? `Use ${variablePrompt.title}` : "Use prompt"}
            </DialogTitle>
          </DialogHeader>
          {variablePrompt ? (
            <div className="space-y-4">
              {variablePrompt.variables?.length ? (
                variablePrompt.variables.map((variable) => (
                  <div key={variable.name} className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                      {variable.label || variable.name}
                      {variable.required && (
                        <span className="text-xs text-muted-foreground">
                          (required)
                        </span>
                      )}
                    </Label>
                    <Input
                      placeholder={variable.placeholder || variable.name}
                      value={variableValues[variable.name] ?? ""}
                      onChange={(e) =>
                        setVariableValues((prev) => ({
                          ...prev,
                          [variable.name]: e.target.value,
                        }))
                      }
                    />
                    {variable.description && (
                      <p className="text-xs text-muted-foreground">
                        {variable.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No variables required. Apply to drop into the chat box.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Daily standup helper"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea
                  value={draft.content}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Summarize the following updates: {{updates}}"
                  className="min-h-[140px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tags</Label>
                <Input
                  value={draft.tags}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="planning, team"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVariablePrompt(null)}>
              Cancel
            </Button>
            {variablePrompt ? (
              <Button
                onClick={() =>
                  variablePrompt && applyPrompt(variablePrompt, variableValues)
                }
              >
                Apply prompt
              </Button>
            ) : (
              <Button
                onClick={() => handleCreate()}
                disabled={createPrompt.isPending}
              >
                Save prompt
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Create prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Daily standup helper"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea
                value={draft.content}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Summarize the following updates: {{updates}}"
                className="min-h-[140px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Input
                value={draft.tags}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="planning, team"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await handleCreate();
                setIsCreateOpen(false);
              }}
              disabled={createPrompt.isPending}
            >
              Save prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
