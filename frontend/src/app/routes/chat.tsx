import {
  memo,
  useCallback,
  type ChangeEvent,
  type RefObject,
  useLayoutEffect,
  useEffect,
  useRef,
} from "react";
import { AnimatePresence } from "framer-motion";

import { ModernChatArea } from "@/features/composer/components/chat-composer";
import { Message } from "@/features/messages/components/message";
import { APP_AI_WARNING_TEXT, APP_NAME } from "@/configuration/const";
import { getTimeToGreeting } from "@/utils/format";

import { useSettings } from "@/features/settings/api/get-settings";
import { useConsolidatedChatState } from "@/features/chat/hooks/use-consolidated-chat-state";
import { useIntelligentScroll } from "@/features/chat/hooks/use-intelligent-scroll";

import { useChatStore } from "@/features/chat/stores/chat-store";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollToBottomButton } from "@/components/ui/scroll-to-bottom-button";
import { type Message as ChatMessage } from "@/features/chat/types";
import { useVirtualizer } from "@tanstack/react-virtual";

const COMPOSER_OVERLAP_PX = 55;
const COMPOSER_WIDTH_CLASSES = "";
type ChatViewMode = "loading" | "welcome" | "conversation";

export function ChatRoute() {
  const settings = useSettings();
  const {
    conversationId,
    messages,
    hasMessages,
    isLoading,
    isPending,
    inputValue,
    attachments,
    handleSendMessage,
    handleInputChange,
    handleAttachmentsChange,
    handleRemoveAttachment,
  } = useConsolidatedChatState();

  const streamedContent = useChatStore((s) =>
    s.currentConversationId && s.streams[s.currentConversationId]
      ? s.streams[s.currentConversationId].message.content
      : s.streamedMessage?.content,
  );
  const isStreaming = useChatStore((s) =>
    s.currentConversationId && s.streams[s.currentConversationId]
      ? s.streams[s.currentConversationId].isStreaming
      : s.isStreaming,
  );

  const { scrollRef, endRef, showButton, scrollToBottom } =
    useIntelligentScroll(messages, streamedContent, conversationId ?? null, {
      nearBottomPx: 120,
      buttonPx: 80,
      smooth: true,
    });

  // Optional: scroll/highlight a specific message when messageId query param is present
  const highlightRef = useRef<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("messageId");
    if (!targetId) return;
    highlightRef.current = targetId;
    // delay to allow virtualizer to lay out nodes
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-message-id="${CSS.escape(targetId)}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 1600);
      }
    });
  }, [messages, conversationId]);

  const mode: ChatViewMode =
    isLoading && conversationId
      ? "loading"
      : !conversationId || (!hasMessages && !isPending)
        ? "welcome"
        : "conversation";

  const isWelcome = mode === "welcome";
  const mainClassName = [
    "relative w-full",
    isWelcome
      ? "flex min-h-full items-center justify-center px-4 py-10 overflow-hidden"
      : "min-h-0 overflow-y-auto overscroll-contain -mb-[var(--composer-overlap-px)]",
  ].join(" ");

  const onSendMessage = useCallback(
    (msg: string) => handleSendMessage(msg),
    [handleSendMessage],
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange(e),
    [handleInputChange],
  );

  useLayoutEffect(() => {
    if (mode === "conversation") {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [mode, conversationId]);

  return (
    <section
      className="grid h-full grid-rows-[1fr_auto] group/thread @container/thread w-full"
      style={{ "--composer-overlap-px": `${COMPOSER_OVERLAP_PX}px` } as any}
    >
      <main
        ref={scrollRef as RefObject<HTMLDivElement>}
        className={mainClassName}
        data-viewtransition="chat-main"
      >
        {mode === "loading" && <LoadingSkeleton endRef={endRef} />}

        <AnimatePresence mode="popLayout" initial={false}>
          {mode === "welcome" && (
            <WelcomePanel
              name={settings?.data?.name}
              composer={
                <div
                  key="composer-welcome"
                  className={`${COMPOSER_WIDTH_CLASSES} px-4 @[48rem]:px-6`}
                >
                  <ChatComposer
                    mode="welcome"
                    value={inputValue}
                    onChange={onInputChange}
                    onSendMessage={onSendMessage}
                    attachments={attachments}
                    onAttachments={handleAttachmentsChange}
                    onRemoveAttachment={handleRemoveAttachment}
                    disabled={isPending || isLoading}
                  />
                </div>
              }
            />
          )}
        </AnimatePresence>

        {mode === "conversation" && (
          <ConversationView
            messages={messages}
            isStreaming={isStreaming}
            endRef={endRef}
            parentRef={scrollRef as RefObject<HTMLDivElement>}
            composerOverlapPx={COMPOSER_OVERLAP_PX}
          />
        )}
      </main>

      <AnimatePresence mode="popLayout" initial={false}>
        {mode !== "welcome" && (
          <footer
            key="composer-chat"
            className="relative z-10 pt-4 content-fade bg-gradient-to-t from-background via-background to-transparent"
            data-viewtransition="chat-footer"
          >
            <ScrollToBottomButton
              isVisible={showButton}
              onClick={scrollToBottom}
              className="absolute -top-10 left-1/2 -translate-x-1/2"
            />

            <div
              className={`text-base [--thread-content-margin:--spacing(4)] @[37rem]:[--thread-content-margin:--spacing(6)] @[72rem]:[--thread-content-margin:--spacing(16)] px-(--thread-content-margin) ${COMPOSER_WIDTH_CLASSES}`}
            >
              <ChatComposer
                mode="chat"
                value={inputValue}
                onChange={onInputChange}
                onSendMessage={onSendMessage}
                attachments={attachments}
                onAttachments={handleAttachmentsChange}
                onRemoveAttachment={handleRemoveAttachment}
                disabled={isPending || isLoading}
              />
              <p className="mt-2 mb-1 text-center text-xs text-muted-foreground/70">
                {APP_AI_WARNING_TEXT}
              </p>
            </div>
          </footer>
        )}
      </AnimatePresence>
    </section>
  );
}

interface ComposerProps {
  mode: "welcome" | "chat";
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: (msg: string) => void;
  attachments: File[];
  onAttachments: (files: File[]) => void;
  onRemoveAttachment: (name: string) => void;
  disabled: boolean;
}

const ChatComposer = memo<ComposerProps>(
  ({
    mode,
    value,
    onChange,
    onSendMessage,
    attachments,
    onAttachments,
    onRemoveAttachment,
    disabled,
  }) => (
    <ModernChatArea
      value={value}
      onChange={onChange}
      onSendMessage={onSendMessage}
      onAttachments={onAttachments}
      attachments={attachments}
      onRemoveAttachment={onRemoveAttachment}
      placeholder={
        mode === "welcome" ? "Ask anything…" : "Continue the conversation…"
      }
      disabled={disabled}
      mode={mode}
    />
  ),
);
ChatComposer.displayName = "ChatComposer";

function WelcomePanel({
  name,
  composer,
}: {
  name?: string;
  composer: React.ReactNode;
}) {
  return (
    <div className="flex w-full h-full flex-col items-center justify-center">
      <div className="w-full max-w-4xl space-y-2 text-center">
        <header className="space-y-1 pb-4">
          <h1
            className="text-4xl font-semibold
                         tracking-tight animate-in-out"
          >
            What can{" "}
            <span
              className="text-transparent bg-gradient-to-r from-primary via-primary/60 to-primary
                         bg-[length:200%_auto] bg-clip-text"
            >
              {APP_NAME}
            </span>{" "}
            do for you?
          </h1>
          <p className="text-lg font-light text-muted-foreground">
            {name
              ? `${getTimeToGreeting()}, ${name}. Let's chat.`
              : "Start a conversation in your preferred style."}
          </p>
        </header>
        {composer}
        <p className="text-xs text-muted-foreground/50">
          {APP_AI_WARNING_TEXT}
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton({ endRef }: { endRef: RefObject<HTMLDivElement> }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-8">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-1"
          style={{ opacity: 1 - i * 0.15 }}
        >
          {i % 2 ? (
            <div className="flex w-full max-w-[95%] gap-3">
              <div className="flex w-full flex-col gap-1">
                <div className="mb-1 flex flex-row items-end gap-2">
                  <Skeleton className="size-9" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-3 w-42" />
              <Skeleton className="h-20 w-full max-w-[70%]" />
            </div>
          )}
        </div>
      ))}
      <div ref={endRef} className="h-16" />
    </div>
  );
}

interface ConversationProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  endRef: RefObject<HTMLDivElement>;
  parentRef: RefObject<HTMLDivElement>;
  composerOverlapPx: number;
}

function ConversationView({
  messages,
  isStreaming,
  endRef,
  parentRef,
  composerOverlapPx,
}: ConversationProps) {
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 8,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const items = rowVirtualizer.getVirtualItems();

  useLayoutEffect(() => {
    const node = endRef.current;
    if (node) {
      node.scrollIntoView({ behavior: "auto", block: "end" });
      requestAnimationFrame(() =>
        node.scrollIntoView({ behavior: "auto", block: "end" }),
      );
    }
  }, []);

  const bottomPadPx = composerOverlapPx - 12;
  const totalSizeWithPad = rowVirtualizer.getTotalSize() + bottomPadPx;

  return (
    <div className="mx-auto w-full px-4 @[48rem]:px-6 pt-6">
      <div
        className="relative mx-auto flex-1 [--thread-content-max-width:40rem] @[48rem]:[--thread-content-max-width:44rem] @[64rem]:[--thread-content-max-width:48rem] max-w-(--thread-content-max-width)"
        style={{ height: `${totalSizeWithPad}px` }}
      >
        {items.map((virtualRow) => {
          const m = messages[virtualRow.index];
          const isLast = virtualRow.index === messages.length - 1;
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute left-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <div className="space-y-6 my-6 sm:space-y-8">
                <Message
                  key={m.id}
                  message={m}
                  isTyping={
                    isStreaming &&
                    isLast &&
                    m.role === "assistant" &&
                    !m.isGeneratingImage
                  }
                  isGeneratingImage={m.isGeneratingImage}
                  isWaiting={false}
                  isLoading={false}
                  isCancelled={Boolean(m.is_interrupted)}
                  // data attributes passed to wrapper div via extraProps
                  {...({
                    "data-message-id": (m as any).messageId || m.id,
                  } as any)}
                />
              </div>
            </div>
          );
        })}
        {/* Bottom sentinel for scroll-to-bottom */}
        <div
          ref={endRef}
          className="absolute left-0 w-full"
          style={{
            transform: `translateY(${totalSizeWithPad}px)`,
            height: bottomPadPx,
          }}
        />
      </div>
    </div>
  );
}
