import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import {
  defaultChatConfig,
  useChatConfigStore,
} from "@/stores/chat-config-store";
import type { ReactElement } from "react";

const chatConfigSchema = z.object({
  temperature: z
    .number()
    .min(0, { message: "Min 0" })
    .max(100, { message: "Max 100" }),
  topP: z.number().min(0).max(100),
  topK: z.number().min(0).max(100),
  systemPrompt: z.string().max(20000).optional(),
});

type ChatConfigFormValues = z.infer<typeof chatConfigSchema>;

export const ChatSettingsPopover = ({ trigger }: { trigger: ReactElement }) => {
  const {
    temperature,
    topP,
    topK,
    systemPrompt,
    setTemperature,
    setTopP,
    setTopK,
    setSystemPrompt,
    resetConfig,
  } = useChatConfigStore();

  const form = useForm<ChatConfigFormValues>({
    resolver: zodResolver(chatConfigSchema),
    defaultValues: {
      temperature,
      topP,
      topK,
      systemPrompt,
    },
  });

  const isDirty =
    temperature !== defaultChatConfig.temperature ||
    topP !== defaultChatConfig.topP ||
    topK !== defaultChatConfig.topK ||
    systemPrompt !== defaultChatConfig.systemPrompt;

  const onSubmit = (values: ChatConfigFormValues) => {
    setTemperature(values.temperature);
    setTopP(values.topP);
    setTopK(values.topK);
    setSystemPrompt(values.systemPrompt || "");
  };

  const handleReset = () => {
    resetConfig();
    form.reset(defaultChatConfig);
  };

  return (
    <Popover>
      <div className="relative inline-flex">
        {isDirty && (
          <div className="absolute size-2 right-1 top-1 bg-primary rounded-full" />
        )}
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      </div>
      <PopoverContent className="w-[500px]" side="top">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <h4 className="leading-none font-medium">Chat Configuration</h4>
              <p className="text-muted-foreground text-sm">
                Update the configuration for the request.
              </p>
            </div>

            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful assistant..."
                      className="min-h-[80px] max-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topP"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Top P</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topK"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Top K</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between gap-2">
              <Button type="button" variant="secondary" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
};
