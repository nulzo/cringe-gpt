import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {toast} from 'sonner';
import {
    aiSettingsSchema,
    type AISettingsSchema,
} from '@/features/settings/lib/validators.ts';
import {
    useProviderSettings,
} from '@/features/settings/api/get-provider-settings.ts';
import {
    useUpdateProviderSettings,
} from '@/features/settings/api/update-provider-settings.ts';
import {type ProviderType} from '@/features/chat/types';

import {
    Form,
    FormField,
    FormItem,
    FormControl,
    FormLabel,
    FormDescription,
    FormMessage,
} from '@/components/ui/form.tsx';
import {Input} from '@/components/ui/input.tsx';
import {Switch} from '@/components/ui/switch.tsx';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Separator} from '@/components/ui/separator.tsx';
import {IconDeviceFloppy} from '@tabler/icons-react';

const PROVIDERS: Array<ProviderType> = ['Ollama', 'OpenAi', 'OpenRouter', 'Google', 'Anthropic'];

export const AISettingsSection = () => {
    const queries = {
        Ollama: useProviderSettings('Ollama'),
        OpenAi: useProviderSettings('OpenAi'),
        OpenRouter: useProviderSettings('OpenRouter'),
        Google: useProviderSettings('Google'),
        Anthropic: useProviderSettings('Anthropic'),
    } as const;

    const mutations = {
        Ollama: useUpdateProviderSettings('Ollama'),
        OpenAi: useUpdateProviderSettings('OpenAi'),
        OpenRouter: useUpdateProviderSettings('OpenRouter'),
        Google: useUpdateProviderSettings('Google'),
        Anthropic: useUpdateProviderSettings('Anthropic'),
    } as const;

    const isLoading = PROVIDERS.some((p) => queries[p].isLoading);

    const form = useForm<AISettingsSchema>({
        resolver: zodResolver(aiSettingsSchema),
        defaultValues: {
            ollama: {enabled: false, url: '', model: ''},
            openai: {enabled: false, apiKey: '', model: ''},
            openrouter: {enabled: false, apiKey: '', model: ''},
            google: {enabled: false, apiKey: '', model: ''},
            anthropic: {enabled: false, apiKey: '', model: ''},
            temperature: 0.7,
            systemPrompt: 'You are a helpful assistant.',
        },
        mode: 'onChange',
    });

    /* populate defaults once queries settle */
    useEffect(() => {
        if (isLoading) return;

        form.reset({
            ollama: {
                enabled: Boolean(queries.Ollama.data?.apiUrl),
                url: queries.Ollama.data?.apiUrl ?? '',
                model: queries.Ollama.data?.defaultModel ?? '',
            },
            openai: {
                enabled: Boolean(queries.OpenAi.data?.apiKey),
                apiKey: queries.OpenAi.data?.apiKey ?? '',
                model: queries.OpenAi.data?.defaultModel ?? '',
            },
            openrouter: {
                enabled: Boolean(queries.OpenRouter.data?.apiKey),
                apiKey: queries.OpenRouter.data?.apiKey ?? '',
                model: queries.OpenRouter.data?.defaultModel ?? '',
            },
            google: {
                enabled: Boolean(queries.Google.data?.apiKey),
                apiKey: queries.Google.data?.apiKey ?? '',
                model: queries.Google.data?.defaultModel ?? '',
            },
            anthropic: {
                enabled: Boolean(queries.Anthropic.data?.apiKey),
                apiKey: queries.Anthropic.data?.apiKey ?? '',
                model: queries.Anthropic.data?.defaultModel ?? '',
            },

            temperature: 0.7,
            systemPrompt: 'You are a helpful assistant.',
        });
        // we want this to re-run only when queries go from loading→loaded
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);

    const watched = form.watch();

    const handleSubmit = form.handleSubmit(async (data) => {
        try {
            await Promise.all(
                PROVIDERS.map(async (p) => {
                    const payload = (() => {
                        switch (p) {
                            case 'Ollama':
                                return {
                                    apiUrl: data.ollama.url,
                                    defaultModel: data.ollama.model,
                                };
                            default: {
                                const key = p.toLowerCase() as keyof AISettingsSchema;
                                const cfg = data[key] as AISettingsSchema[keyof AISettingsSchema];
                                return {
                                    apiKey: cfg.enabled ? (cfg as any).apiKey : undefined,
                                    defaultModel: (cfg as any).model,
                                };
                            }
                        }
                    })();
                    await mutations[p].mutateAsync(payload);
                }),
            );
            form.reset(data);
            toast.success('AI provider settings saved');
        } catch (err) {
            toast.error('Failed to save', {description: (err as Error).message});
        }
    });

    if (isLoading) {
        return <div className="text-muted-foreground text-sm">Loading…</div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="mb-2 font-medium text-lg">AI Provider Configuration</h3>
            <p className="mb-6 text-muted-foreground text-sm">
                Configure API keys and default settings for all available AI providers.
            </p>
            <div className="space-y-2">
                <Form {...form}>
                    <form id="ai-settings-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* --- Provider blocks --- */}
                        {/* You can DRY this further if desired; kept explicit for clarity */}
                        {/* OLLAMA */}
                        <ProviderCard
                            title="Ollama"
                            enabledField="ollama.enabled"
                            isEnabled={watched.ollama.enabled}
                            switchDisabled={false}
                        >
                            <ProviderField
                                control={form.control}
                                name="ollama.url"
                                label="Ollama URL"
                                placeholder="http://localhost:11434"
                                disabled={!watched.ollama.enabled}
                            />
                            <ProviderField
                                control={form.control}
                                name="ollama.model"
                                label="Default Model"
                                placeholder="llama3"
                                disabled={!watched.ollama.enabled}
                            />
                        </ProviderCard>

                        {/* OPENAI */}
                        <ProviderCard
                            title="OpenAI"
                            enabledField="openai.enabled"
                            isEnabled={watched.openai.enabled}
                        >
                            <ProviderField
                                control={form.control}
                                name="openai.apiKey"
                                label="API Key"
                                type="password"
                                placeholder="sk-…"
                                disabled={!watched.openai.enabled}
                            />
                            <ModelSelect
                                control={form.control}
                                name="openai.model"
                                disabled={!watched.openai.enabled}
                                models={[
                                    {value: 'gpt-4o', label: 'GPT-4o'},
                                    {value: 'gpt-4-turbo', label: 'GPT-4 Turbo'},
                                    {value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo'},
                                ]}
                            />
                        </ProviderCard>

                        <ProviderCard
                            title="OpenRouter"
                            enabledField="openai.enabled"
                            isEnabled={watched.openai.enabled}
                        >
                            <ProviderField
                                control={form.control}
                                name="openrouter.apiKey"
                                label="API Key"
                                type="password"
                                placeholder="sk-…"
                                disabled={!watched.openai.enabled}
                            />
                        </ProviderCard>

                        {/* GOOGLE */}
                        <ProviderCard
                            title="Google"
                            enabledField="google.enabled"
                            isEnabled={watched.google.enabled}
                        >
                            <ProviderField
                                control={form.control}
                                name="google.apiKey"
                                label="API Key"
                                type="password"
                                placeholder="AIzaSy…"
                                disabled={!watched.google.enabled}
                            />
                            <ModelSelect
                                control={form.control}
                                name="google.model"
                                disabled={!watched.google.enabled}
                                models={[
                                    {value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro'},
                                    {value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash'},
                                    {value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro'},
                                ]}
                            />
                        </ProviderCard>

                        {/* ANTHROPIC */}
                        <ProviderCard
                            title="Anthropic"
                            enabledField="anthropic.enabled"
                            isEnabled={watched.anthropic.enabled}
                        >
                            <ProviderField
                                control={form.control}
                                name="anthropic.apiKey"
                                label="API Key"
                                type="password"
                                placeholder="sk-ant-…"
                                disabled={!watched.anthropic.enabled}
                            />
                            <ModelSelect
                                control={form.control}
                                name="anthropic.model"
                                disabled={!watched.anthropic.enabled}
                                models={[
                                    {value: 'claude-3-opus-20240229', label: 'Claude 3 Opus'},
                                    {value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet'},
                                    {value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku'},
                                    {value: 'claude-2.1', label: 'Claude 2.1'},
                                ]}
                            />
                        </ProviderCard>

                        <Separator className="my-8"/>

                        {/* Global defaults */}
                        <GlobalDefaultsFields control={form.control}/>

                        {/* Footer */}
                        <div className="flex justify-end pt-6 border-t">
                            <Button
                                type="submit"
                                form="ai-settings-form"
                                disabled={!form.formState.isDirty || !form.formState.isValid}
                            >
                                <IconDeviceFloppy size={16} className="mr-1.5"/>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

import type {Control, FieldPath, FieldValues} from 'react-hook-form';

function ProviderField<T extends FieldValues>({
                                                  control,
                                                  name,
                                                  label,
                                                  placeholder,
                                                  disabled,
                                                  type = 'text',
                                              }: {
    control: Control<T>;
    name: FieldPath<T>;
    label: string;
    placeholder?: string;
    disabled?: boolean;
    type?: 'text' | 'password';
}) {
    return (
        <FormField
            control={control}
            name={name as any}
            render={({field}) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input {...field} placeholder={placeholder} disabled={disabled} type={type}/>
                    </FormControl>
                    <FormMessage/>
                </FormItem>
            )}
        />
    );
}

function ProviderCard({
                          title,
                          enabledField,
                          isEnabled,
                          children,
                          switchDisabled = false,
                      }: {
    title: string;
    enabledField: FieldPath<AISettingsSchema>;
    isEnabled: boolean;
    switchDisabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-6 p-4 border rounded-lg">
            <FormField
                name={enabledField as any}
                render={({field}) => (
                    <FormItem className="flex justify-between items-center mb-4">
                        <FormLabel className="font-semibold text-base">{title}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={switchDisabled}/>
                        </FormControl>
                    </FormItem>
                )}
            />
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function ModelSelect<T extends FieldValues>({
                                                control,
                                                name,
                                                models,
                                                disabled,
                                            }: {
    control: Control<T>;
    name: FieldPath<T>;
    models: Array<{ value: string; label: string }>;
    disabled?: boolean;
}) {
    return (
        <FormField
            control={control}
            name={name as any}
            render={({field}) => (
                <FormItem>
                    <FormLabel>Default Model</FormLabel>
                    <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={disabled}
                    >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select model"/>
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {models.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage/>
                </FormItem>
            )}
        />
    );
}

function GlobalDefaultsFields({control}: { control: Control<AISettingsSchema>; }) {
    return (
        <div>
            <h3 className="mb-2 font-medium text-lg">Global AI Defaults</h3>
            <p className="mb-6 text-muted-foreground text-sm">
                Configure default behavior for AI interactions.
            </p>
            <div className="gap-6 grid grid-cols-1 md:grid-cols-2 mb-6">
                <ProviderField
                    control={control}
                    name="temperature"
                    label="Default Temperature"
                    placeholder="0.7"
                    disabled={false}
                />
            </div>
            <FormField
                control={control}
                name="systemPrompt"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Default System Prompt</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="You are a helpful AI assistant…"/>
                        </FormControl>
                        <FormDescription>
                            The default instructions given to the AI model.
                        </FormDescription>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        </div>
    );
}

export { AISettingsSection as default };