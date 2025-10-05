import { create } from 'zustand';
import { type Message } from '../types';

interface ConversationStreamState {
  message: Message;
  isStreaming: boolean;
  abortController: AbortController | null;
}

interface ChatState {
  messages: Message[];
  // global for backward compatibility; not used for UI decisions
  streamedMessage: Message | null;
  isStreaming: boolean;
  currentConversationId: string | null;
  abortController: AbortController | null;

  // Multi-conversation streaming state
  streams: Record<string, ConversationStreamState>;
  unread: Record<string, boolean>;

  // Performance optimizations
  visibleMessageRange: { start: number; end: number } | null;
  maxVisibleMessages: number;

  // Input state
  inputValue: string;
  attachments: File[];

  // Message actions
  setMessages: (messages: Message[], conversationId?: string) => void;
  addMessage: (message: Message) => void;
  setStreamedMessage: (message: Message | null) => void;
  appendStreamedMessage: (chunk: string) => void;
  appendStreamedMessageFor: (conversationId: string, chunk: string) => void;
  appendStreamedMessageBatch: (chunks: string[]) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  clearStreaming: () => void;
  clearConversation: () => void;
  setAbortController: (controller: AbortController | null) => void;
  cancelStream: () => void;

  // Multi-conversation streaming actions
  startStream: (key: string, initialAssistant: Message, abortController: AbortController) => void;
  renameStreamKey: (oldKey: string, newKey: string) => void;
  appendStreamFor: (key: string, chunk: string) => void;
  finalizeStream: (key: string, finalMessage: Message) => void;
  cancelStreamFor: (key: string) => void;
  markConversationRead: (conversationId: string) => void;
  isStreamingFor: (conversationId?: string | null) => boolean;

  // Performance actions
  setVisibleMessageRange: (range: { start: number; end: number } | null) => void;
  setMaxVisibleMessages: (max: number) => void;
  getVisibleMessages: () => Message[];

  // Input actions
  setInputValue: (value: string) => void;
  setAttachments: (files: File[]) => void;
  addAttachments: (files: File[]) => void;
  removeAttachment: (fileName: string) => void;
  clearInput: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  streamedMessage: null,
  isStreaming: false,
  currentConversationId: null,
  abortController: null,
  streams: {},
  unread: {},
  visibleMessageRange: null,
  maxVisibleMessages: 50, // Default to showing last 50 messages
  inputValue: '',
  attachments: [],

  // Message actions
  setMessages: (messages, conversationId) => set((state) => {
    const cap = Math.max(200, state.maxVisibleMessages * 40); // keep ample history but bounded
    const trimmed = messages.length > cap ? messages.slice(messages.length - cap) : messages;
    return {
      messages: trimmed,
      currentConversationId: conversationId || null
    };
  }),

  addMessage: (message) => set((state) => {
    const cap = Math.max(200, state.maxVisibleMessages * 40);
    const next = [...state.messages, message];
    const trimmed = next.length > cap ? next.slice(next.length - cap) : next;
    return { messages: trimmed };
  }),

  setStreamedMessage: (message) => set({ streamedMessage: message }),

  appendStreamedMessage: (chunk) =>
    set((state) => {
      if (!state.streamedMessage) return {};
      return {
        streamedMessage: {
          ...state.streamedMessage,
          content: state.streamedMessage.content + chunk,
        },
      };
    }),

  appendStreamedMessageFor: (conversationId, chunk) =>
    set((state) => {
      if (!state.streamedMessage) return {};
      if (state.streamedMessage.conversation_uuid !== conversationId) return {};
      return {
        streamedMessage: {
          ...state.streamedMessage,
          content: state.streamedMessage.content + chunk,
        },
      };
    }),

  appendStreamedMessageBatch: (chunks) =>
    set((state) => {
      if (!state.streamedMessage) return {};
      const combinedChunk = chunks.join('');
      return {
        streamedMessage: {
          ...state.streamedMessage,
          content: state.streamedMessage.content + combinedChunk,
        },
      };
    }),

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  clearStreaming: () => set({ streamedMessage: null, isStreaming: false, abortController: null }),

  clearConversation: () => set({
    messages: [],
    streamedMessage: null,
    isStreaming: false,
    currentConversationId: null,
    visibleMessageRange: null
  }),

  setAbortController: (controller) => set({ abortController: controller }),

  cancelStream: () => {
    const { abortController, streamedMessage } = get();
    // Abort the network request if available
    if (abortController) {
      abortController.abort();
    }

    // If we have a partial streamed message, commit it as interrupted
    if (streamedMessage) {
      set((state) => ({
        messages: [
          ...state.messages,
          { ...streamedMessage, is_interrupted: true },
        ],
        streamedMessage: null,
        isStreaming: false,
        abortController: null,
      }));
    } else {
      set({ isStreaming: false, abortController: null });
    }
  },

  // Performance actions
  setVisibleMessageRange: (range) => set({ visibleMessageRange: range }),

  setMaxVisibleMessages: (max) => set({ maxVisibleMessages: max }),

  getVisibleMessages: () => {
    const { messages, streamedMessage, visibleMessageRange, maxVisibleMessages, currentConversationId, streams } = get();

    // If no range is set, show last N messages for performance
    if (!visibleMessageRange) {
      const startIndex = Math.max(0, messages.length - maxVisibleMessages);
      const visibleMessages = messages.slice(startIndex);

      // Include streamed message for active conversation from multi-streams first
      if (currentConversationId && streams[currentConversationId]) {
        return [...visibleMessages, streams[currentConversationId].message];
      }
      // Fallback for legacy single stream
      if (streamedMessage && streamedMessage.conversation_uuid === currentConversationId) {
        return [...visibleMessages, streamedMessage];
      }
      return visibleMessages;
    }

    // Use custom range
    const visibleMessages = messages.slice(visibleMessageRange.start, visibleMessageRange.end);

    // Include streamed message if it's within range or if it's currently streaming
    if (currentConversationId && streams[currentConversationId]) {
      const isStreamedMessageVisible = visibleMessageRange.end >= messages.length;
      if (isStreamedMessageVisible) visibleMessages.push(streams[currentConversationId].message);
    } else if (streamedMessage && streamedMessage.conversation_uuid === currentConversationId) {
      const isStreamedMessageVisible = visibleMessageRange.end >= messages.length && get().isStreaming;
      if (isStreamedMessageVisible) visibleMessages.push(streamedMessage);
    }

    return visibleMessages;
  },

  // Input actions
  setInputValue: (value) => set({ inputValue: value }),
  setAttachments: (files) => set({ attachments: files }),
  addAttachments: (files) => set((state) => ({
    attachments: [...state.attachments, ...files]
  })),
  removeAttachment: (fileName) => set((state) => ({
    attachments: state.attachments.filter(f => f.name !== fileName)
  })),
  clearInput: () => set({ inputValue: '', attachments: [] }),

  // Multi-conversation streaming actions impl
  startStream: (key, initialAssistant, abortController) => set((state) => ({
    streams: {
      ...state.streams,
      [key]: { message: initialAssistant, isStreaming: true, abortController },
    },
  })),

  renameStreamKey: (oldKey, newKey) => set((state) => {
    if (!state.streams[oldKey]) return {} as any;
    const { [oldKey]: oldStream, ...rest } = state.streams;
    return { streams: { ...rest, [newKey]: oldStream } };
  }),

  appendStreamFor: (key, chunk) => set((state) => {
    const s = state.streams[key];
    if (!s) return {} as any;
    return {
      streams: {
        ...state.streams,
        [key]: { ...s, message: { ...s.message, content: s.message.content + chunk } },
      },
    };
  }),

  finalizeStream: (key, finalMessage) => set((state) => {
    const { [key]: _, ...rest } = state.streams;
    const finishedId = String(finalMessage.conversation_uuid || key);
    const isActive = state.currentConversationId === finishedId;
    return {
      messages: isActive ? [...state.messages, finalMessage] : state.messages,
      streams: rest,
      unread: isActive ? state.unread : { ...state.unread, [finishedId]: true },
    } as any;
  }),

  cancelStreamFor: (key) => set((state) => {
    const s = state.streams[key];
    if (!s) return {} as any;
    if (s.abortController) s.abortController.abort();
    const interrupted = { ...s.message, is_interrupted: true } as Message;
    const { [key]: _, ...rest } = state.streams;
    return { messages: [...state.messages, interrupted], streams: rest } as any;
  }),

  markConversationRead: (conversationId) => set((state) => {
    if (!conversationId) return {} as any;
    const { [conversationId]: __, ...rest } = state.unread;
    return { unread: rest, currentConversationId: conversationId } as any;
  }),

  isStreamingFor: (conversationId) => {
    if (!conversationId) return false;
    const s = get().streams[conversationId];
    return Boolean(s?.isStreaming);
  },
}));
