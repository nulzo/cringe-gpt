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
import { IconHash } from "@tabler/icons-react";
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
import { GenericResourceSelector } from "./generic-resource-selector";

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
  // We no longer set activePromptId to avoid the bug where it overrides text
  const { setPromptVariables } = useChatConfigStore();
  const { setInputValue } = useChatStore();

  const [variablePrompt, setVariablePrompt] = useState<Prompt | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {},
  );

  const [draft, setDraft] = useState<{
    title: string;
    content: string;
    tags: string;
  }>({
    title: "",
    content: "",
    tags: "",
  });

  const applyPrompt = (prompt: Prompt, values: Record<string, string> = {}) => {
    // BUG FIX: Do not set activePromptId. Just insert text.
    // setActivePrompt(prompt.id, prompt.title); 
    setPromptVariables(values);
    const rendered = renderTemplate(prompt.content, values);
    setInputValue(rendered);
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
      <GenericResourceSelector
        items={promptsQuery.data ?? []}
        // No active ID tracking for prompts as they are one-off insertions
        activeId={null} 
        activeLabel={null}
        onSelect={handlePromptSelect}
        onClear={() => {
          // No op since we don't have active prompt state
        }}
        onCreate={() => setIsCreateOpen(true)}
        icon={IconHash}
        tooltip="Select prompt"
        searchPlaceholder="Search prompts..."
        emptyMessage="No prompts found"
        side="bottom"
        getSearchTerms={(prompt) => [
          prompt.title,
          prompt.content,
          ...(prompt.tags?.map(t => t.name) || [])
        ]}
        renderItem={(prompt) => (
          <div className="flex flex-col gap-1 min-w-0 flex-1 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">{prompt.title}</span>
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
        )}
      />

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
          {variablePrompt && (
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
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVariablePrompt(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                variablePrompt && applyPrompt(variablePrompt, variableValues)
              }
            >
              Apply prompt
            </Button>
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
