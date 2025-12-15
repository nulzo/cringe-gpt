import { useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConversation } from "../api/get-conversation";
import { useChatStore } from "../stores/chat-store";
import { useSendStreamMessage } from "../api/send-stream-message";
import { useQueryClient } from "@tanstack/react-query";

// Attachment conversion is handled in the streaming API layer; keep UI memory light here.

export function useConsolidatedChatState() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Explicitly select all necessary state reactively so the React Compiler (and manual useMemo)
  // knows exactly what this component depends on.
  const messages = useChatStore((state) => state.messages);
  const currentConversationId = useChatStore(
    (state) => state.currentConversationId,
  );
  const streams = useChatStore((state) => state.streams);
  const streamedMessage = useChatStore((state) => state.streamedMessage);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const visibleMessageRange = useChatStore(
    (state) => state.visibleMessageRange,
  );
  const maxVisibleMessages = useChatStore((state) => state.maxVisibleMessages);

  const inputValue = useChatStore((state) => state.inputValue);
  const attachments = useChatStore((state) => state.attachments);

  // Actions can be destructured safely as they are stable
  const {
    setMessages,
    setInputValue,
    addAttachments,
    removeAttachment,
    clearInput,
  } = useChatStore();

  // Fetch conversation data using React Query
  const {
    data: conversation,
    isLoading,
    error,
  } = useConversation(conversationId!, {
    enabled: !!conversationId,
  });

  // Load conversation messages whenever fetched conversation changes
  useEffect(() => {
    if (conversation && conversationId) {
      setMessages(conversation.messages, conversationId);
    } else if (!conversationId) {
      // Clear messages if we go to root
      setMessages([], undefined);
    }
  }, [conversation, conversationId, setMessages]);

  // Send message mutation
  const sendMessageMutation = useSendStreamMessage({
    onSuccess: () => {
      clearInput();
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: unknown) => {
      console.error("Failed to send message:", error);
    },
  });

  // Smooth typing animation for character-by-character streaming
  const createTypingAnimation = useCallback(
    (
      text: string,
      onProgress: (currentText: string) => void,
      onComplete: () => void,
    ) => {
      let currentIndex = 0;
      let animationId: number;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const targetIndex = Math.min(text.length, Math.floor(elapsed / 15)); // ~15ms per character

        if (targetIndex > currentIndex) {
          currentIndex = targetIndex;
          onProgress(text.slice(0, currentIndex));

          if (currentIndex >= text.length) {
            onComplete();
            return;
          }
        }

        animationId = requestAnimationFrame(animate);
      };

      animationId = requestAnimationFrame(animate);

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    },
    [],
  );

  // Handle sending message
  const handleSendMessage = async (message: string) => {
    if (!message.trim() && attachments.length === 0) return;

    // Defer attachment conversion to the streaming API layer to keep UI memory light
    sendMessageMutation.mutate({
      conversationId: conversationId || null,
      content: message,
      attachments,
      onNewConversation: (newConversationId: string) => {
        navigate(`/chat/${newConversationId}`);
      },
    });
  };

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  // Handle attachments change
  const handleAttachmentsChange = (files: File[]) => {
    addAttachments(files);
  };

  // Handle remove attachment
  const handleRemoveAttachment = (fileName: string) => {
    removeAttachment(fileName);
  };

  // Re-implement getVisibleMessages logic here using useMemo and the reactive state variables.
  // This makes the dependency chain explicit for the compiler.
  const allMessages = useMemo(() => {
    // If no range is set, show last N messages for performance
    if (!visibleMessageRange) {
      const startIndex = Math.max(0, messages.length - maxVisibleMessages);
      const visibleMessages = messages.slice(startIndex);

      // Include streamed message for active conversation from multi-streams first
      if (currentConversationId && streams[currentConversationId]) {
        return [...visibleMessages, streams[currentConversationId].message];
      }
      // Fallback for legacy single stream
      if (
        streamedMessage &&
        streamedMessage.conversation_uuid === currentConversationId
      ) {
        return [...visibleMessages, streamedMessage];
      }
      return visibleMessages;
    }

    // Use custom range
    const visibleMessages = messages.slice(
      visibleMessageRange.start,
      visibleMessageRange.end,
    );

    // Include streamed message if it's within range or if it's currently streaming
    if (currentConversationId && streams[currentConversationId]) {
      const isStreamedMessageVisible =
        visibleMessageRange.end >= messages.length;
      if (isStreamedMessageVisible)
        visibleMessages.push(streams[currentConversationId].message);
    } else if (
      streamedMessage &&
      streamedMessage.conversation_uuid === currentConversationId
    ) {
      const isStreamedMessageVisible =
        visibleMessageRange.end >= messages.length && isStreaming;
      if (isStreamedMessageVisible) visibleMessages.push(streamedMessage);
    }

    return visibleMessages;
  }, [
    messages,
    streamedMessage,
    streams,
    currentConversationId,
    visibleMessageRange,
    maxVisibleMessages,
    isStreaming,
  ]);

  const hasMessages = allMessages.length > 0;

  return {
    // State
    conversationId,
    messages: allMessages,
    hasMessages,
    isLoading,
    error,
    isPending: sendMessageMutation.isPending,
    inputValue,
    attachments,

    // Actions
    handleSendMessage,
    handleInputChange,
    handleAttachmentsChange,
    handleRemoveAttachment,

    // Utilities
    createTypingAnimation,
  };
}
