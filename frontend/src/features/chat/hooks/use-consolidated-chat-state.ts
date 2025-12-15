import { useEffect, useCallback } from "react";
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

  // Get state from store
  const {
    inputValue,
    attachments,
    setMessages,
    setInputValue,
    addAttachments,
    removeAttachment,
    clearInput,
    getVisibleMessages,
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

  // Optimized message computation using visible messages for performance
  const allMessages = getVisibleMessages();

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
