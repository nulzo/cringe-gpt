import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { useChatStore } from '../stores/chat-store';
import { useChatConfigStore } from '@/stores/chat-config-store';
import { type Message } from '../types';
import { normalizeMessage } from './get-conversation';
import { env } from '@/configuration/env';
import useNotificationStore from '@/stores/notification-store';
import { CHAT_MAX_ATTACHMENTS } from '../config';
import { fileToBase64, filterValidAttachments } from '../utils/attachments';

// Define the attachment interface
interface AttachmentDto {
  fileName: string;
  contentType: string;
  base64Data: string;
}

export type StreamMessageInput = {
  conversationId: string | null;
  content: string;
  attachments?: File[] | AttachmentDto[];
  onNewConversation?: (conversationId: string) => void;
  onStreamInterrupted?: (error: any, recoveryInfo: any) => void;
};

const streamMessageFn = async (variables: StreamMessageInput) => {
  const {
    addMessage,
    // legacy methods (unused post multi-stream)
    clearStreaming,
    clearConversation,
    currentConversationId,
    setAbortController,
    startStream,
    renameStreamKey,
    appendStreamFor,
    appendStreamImageFor,
    finalizeStream,
  } = useChatStore.getState();

  const {
    selectedModelId,
    selectedProvider,
    temperature,
    topP,
    topK,
    maxTokens,
    isTemporary,
    systemPrompt,
    activePersonaId,
    activePromptId,
    promptVariables,
  } =
    useChatConfigStore.getState();

  const { conversationId, content, attachments, onNewConversation, onStreamInterrupted } = variables;

  // Validate required fields
  if (!selectedModelId || !selectedProvider) {
    throw new Error('Please select a model and provider before sending a message');
  }

  // Cancel any existing stream from a different conversation to prevent cross-stream bleed
  const existingState = useChatStore.getState();
  if (existingState.isStreaming && existingState.streamedMessage && existingState.streamedMessage.conversation_uuid !== (conversationId || '')) {
    existingState.cancelStream();
  }

  // Clear previous conversation if starting a new one
  if (!conversationId && currentConversationId) {
    clearConversation();
  }

  // Add user message immediately (avoid object URLs here; previews should manage their own URLs)
  const userMessage: Message = {
    id: `temp-user-${Date.now()}`,
    conversation_uuid: conversationId || '',
    role: 'user',
    content,
    created_at: new Date().toISOString(),
    attachments: attachments?.map(attachment => {
      if (attachment instanceof File) {
        return {
          file_name: attachment.name,
          file_path: '', // previews handled in UI; do not persist object URLs in store
          file_type: attachment.type,
        };
      } else {
        return {
          file_name: attachment.fileName,
          file_path: `data:${attachment.contentType};base64,${attachment.base64Data}`,
          file_type: attachment.contentType,
        };
      }
    }),
  };
  addMessage(userMessage);

  // Set up streaming message (per-conversation stream)
  const tempAssistant: Message = {
    id: `temp-assistant-${Date.now()}`,
    conversation_uuid: conversationId || '',
    role: 'assistant',
    content: '',
    created_at: new Date().toISOString(),
    provider: selectedProvider,
    model: selectedModelId,
  };

  // Process attachments - handle both File[] and AttachmentDto[]; enforce size limits
  let attachmentDtos: AttachmentDto[] | null = null;

  if (attachments && attachments.length > 0) {
    const incomingFiles = attachments.filter((attachment): attachment is File => attachment instanceof File);
    const incomingDtos = attachments.filter((attachment): attachment is AttachmentDto => !(attachment instanceof File));

    const validFiles = filterValidAttachments(incomingFiles);
    const preparedFiles = await Promise.all(
      validFiles.map(async (attachment) => ({
        fileName: attachment.name,
        contentType: attachment.type,
        base64Data: await fileToBase64(attachment),
      }))
    );

    attachmentDtos = [...incomingDtos, ...preparedFiles].slice(0, CHAT_MAX_ATTACHMENTS);
  }

  // Make request
  const token = localStorage.getItem('token');
  // Setup abortable streaming request
  const abortController = new AbortController();
  setAbortController(abortController);
  startStream(conversationId || 'pending', tempAssistant, abortController);

  const base = import.meta.env.MODE === 'production' ? '' : env.API_URL;
  const response = await fetch(`${base}/api/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      conversationId: conversationId || null,
      message: content,
      model: selectedModelId,
      provider: selectedProvider,
      stream: true,
      isTemporary,
      temperature,
      topP,
      topK,
      maxTokens,
      systemPrompt,
      attachments: attachmentDtos,
      personaId: activePersonaId,
      promptId: activePromptId,
      promptVariables,
    }),
    signal: abortController.signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Process stream with optimized real-time updates
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let receivedConversationId = conversationId;
  let contentAccumulator = '';
  let lastUpdateTime = Date.now();
  let updateScheduled = false;

  // Resolve target conversation ID for appending
  const getTargetConversationId = () => {
    const activeStream = useChatStore.getState().streamedMessage;
    return (activeStream?.conversation_uuid || receivedConversationId || conversationId || '') as string;
  };

  // Smart update scheduler that balances responsiveness with performance and appends only to target conversation
  const scheduleSmartUpdate = (immediate = false) => {
    if (updateScheduled && !immediate) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;

    if (immediate || timeSinceLastUpdate > 16 || contentAccumulator.length >= 3) {
      // Update immediately for responsiveness
      updateScheduled = true;
      const targetId = getTargetConversationId();
      if (targetId) {
        useChatStore.getState().appendStreamedMessageFor(targetId, contentAccumulator);
      }
      contentAccumulator = '';
      lastUpdateTime = now;
      updateScheduled = false;
    } else {
      // Schedule for next frame for smooth animation
      updateScheduled = true;
      requestAnimationFrame(() => {
        if (contentAccumulator.length > 0) {
          const targetId = getTargetConversationId();
          if (targetId) {
            useChatStore.getState().appendStreamedMessageFor(targetId, contentAccumulator);
          }
          contentAccumulator = '';
          lastUpdateTime = Date.now();
        }
        updateScheduled = false;
      });
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim().length === 0) continue;

        const eventMatch = line.match(/^event: (.*)$/m);
        const dataMatch = line.match(/^data: (.*)$/m);

        if (eventMatch && dataMatch) {
          const eventType = eventMatch[1];
          const eventData = JSON.parse(dataMatch[1]);

          switch (eventType) {
            case 'conversation_id':
              if (eventData) {
                const newId = eventData.toString();
                receivedConversationId = newId;
                renameStreamKey(conversationId || 'pending', newId);
                if (onNewConversation) onNewConversation(newId);
                // ensure sidebar shows new chat immediately
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                queryClient.invalidateQueries({ queryKey: ['conversation', receivedConversationId] });
              }
              break;
            case 'content':
              // Accumulate content for smart updates (append guarded by scheduleSmartUpdate)
              if (typeof eventData === 'string' && eventData.length > 0) {
                contentAccumulator += eventData;

                // Smart scheduling: update immediately for first characters, then optimize
                // keep scheduling cadence simple under multi-stream

                // Append to the specific stream
                const key = (receivedConversationId || conversationId || 'pending') as string;
                appendStreamFor(key, contentAccumulator);
                contentAccumulator = '';
                lastUpdateTime = Date.now();
              }
              break;
            case 'image':
              // Flush any pending content before handling images
              if (contentAccumulator.length > 0) {
                scheduleSmartUpdate(true);
              }
              const url =
                eventData?.image_url?.url ??
                eventData?.url ??
                eventData?.Url ??
                eventData?.image_url?.Url;
              if (eventData && url) {
                const key = (receivedConversationId || conversationId || 'pending') as string;
                appendStreamImageFor(key, {
                  ...eventData,
                  image_url: eventData.image_url ?? { url },
                });
              }
              break;
            case 'final_message':
              // Flush any remaining content before finalizing
              if (contentAccumulator.length > 0) {
                scheduleSmartUpdate(true);
              }

              try {
                if (eventData) {
                  // Normalize server payload consistently with conversation fetch path
                  const normalized = normalizeMessage({
                    ...eventData,
                    // ensure conversation id and content fallbacks
                    conversation_uuid: eventData.conversationId ?? receivedConversationId ?? conversationId ?? '',
                    role: 'assistant',
                  });

                  const finishedConversationId = String(receivedConversationId ?? normalized.conversation_uuid ?? '');

                  finalizeStream(finishedConversationId || 'pending', normalized);

                  // Refresh caches so background chat shows updated when navigated to
                  if (finishedConversationId) {
                    queryClient.invalidateQueries({ queryKey: ['conversation', finishedConversationId] });
                  }
                  queryClient.invalidateQueries({ queryKey: ['conversations'] });
                } else {
                  console.warn('Missing final message or event data:', { eventData });
                }
              } catch (error) {
                console.error('Error processing final message:', error, eventData);
                // ignore
              }
              break;
            case 'error':
              useNotificationStore.getState().addNotification({
                type: 'error',
                title: 'Chat Error',
                message: eventData.detail || eventData.message || 'The assistant ran into a problem. You can retry.',
              });
              // Keep streaming state; a final_message may follow with the persisted error message
              break;
          }
        }
      }
    }
  } catch (error: any) {
    // Flush any remaining content on error
    if (contentAccumulator.length > 0) {
      scheduleSmartUpdate(true);
    }

    clearStreaming();

    // Call onStreamInterrupted if provided
    if (onStreamInterrupted) {
      onStreamInterrupted(error, {
        conversationId: receivedConversationId,
        error: error
      });
    }

    // Swallow abort errors to avoid surfacing as user-visible errors
    if (error?.name === 'AbortError') {
      return;
    }
    throw error;
  }
};

export const useSendStreamMessage = (options?: any) =>
  useMutation<any, unknown, StreamMessageInput>({
    mutationKey: ['send-stream-message'],
    mutationFn: streamMessageFn,
    ...options,
    onError: (error: any) => {
      useChatStore.getState().clearStreaming();
      // Suppress notifications for intentional cancels
      if (error?.name !== 'AbortError') {
        useNotificationStore.getState().addNotification({
          type: 'error',
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to send message',
        });
        options?.onError?.(error);
      }
    },
  });
